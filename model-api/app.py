import cv2
from flask import Flask, request, jsonify, send_file
import tensorflow as tf
from PIL import Image
import numpy as np
import io
import json
import matplotlib.pyplot as plt
import tensorflow.keras.backend as K

# Initialize Flask app and load model
app = Flask(__name__)
model = tf.keras.models.load_model('models/cnn_model.keras')

# Load class names from JSON file
with open('json/class_names.json', 'r') as f:
    class_names = json.load(f)

def preprocess_image(image):
    """Preprocess the image for model prediction."""
    image = image.resize((224, 224))  # Resize for model input
    image = image.convert('RGB')  # Ensure 3 channels
    image_array = np.array(image) / 255.0  # Normalize
    image_array = np.expand_dims(image_array, axis=0)  # Expand dimensions for batch
    return image_array

def get_gradcam_heatmap(model, img_array):
    # Choose the convolutional layer from which to extract activations
    last_conv_layer = model.get_layer('conv2d') # Choose the last conv layer
    
    # Create a model that maps the input image to the activations of the last conv layer
    last_conv_model = tf.keras.Model(model.inputs, last_conv_layer.output)
    
    # Create a model that maps the activations of the last conv layer to the final class predictions
    classifier_input = tf.keras.Input(shape=last_conv_layer.output.shape[1:])
    x = classifier_input
    for layer in model.layers[model.layers.index(last_conv_layer) + 1:]:
        x = layer(x)
    classifier_model = tf.keras.Model(classifier_input, x)
    
    # Compute the gradient of the top predicted class for our input image
    with tf.GradientTape() as tape:
        # Compute activations of the last conv layer and make the tape watch it
        last_conv_output = last_conv_model(img_array)
        tape.watch(last_conv_output)
        
        # Compute class predictions
        preds = classifier_model(last_conv_output)
        top_pred_index = tf.argmax(preds[0])
        top_class_channel = preds[:, top_pred_index]
        
    # This is the gradient of the top predicted class with regard to the output feature map of the last conv layer
    grads = tape.gradient(top_class_channel, last_conv_output)
    
    # This is a vector where each entry is the mean intensity of the gradient over a specific feature map channel
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    
    # We multiply each channel in the feature map array by "how important this channel is" with regard to the top predicted class
    last_conv_output = last_conv_output.numpy()[0]
    pooled_grads = pooled_grads.numpy()
    for i in range(pooled_grads.shape[-1]):
        last_conv_output[:, :, i] *= pooled_grads[i]
        
    # The channel-wise mean of the resulting feature map is our heatmap of class activation
    heatmap = np.mean(last_conv_output, axis=-1)
    
    # For visualization purpose, we will also normalize the heatmap between 0 and 1
    heatmap = np.maximum(heatmap, 0) / np.max(heatmap)
    
    return heatmap, top_pred_index.numpy()

@app.route('/heatmap', methods=['POST'])
def heatmap():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    image = Image.open(io.BytesIO(file.read()))
    preprocessed_image = preprocess_image(image)

    # Get heatmap and predicted class index
    heatmap, class_idx = get_gradcam_heatmap(model, preprocessed_image)

    # Convert heatmap to an image
    heatmap = np.uint8(255 * heatmap)  # Scale the heatmap to [0, 255]
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)  # Apply the colormap
    
    # Overlay heatmap on the original image
    image = cv2.resize(np.array(image), (224, 224))  # Resize original image for overlay
    heatmap = cv2.resize(heatmap, (224, 224))  # Resize heatmap to match image size
    overlay_image = cv2.addWeighted(heatmap, 0.5, image, 0.5, 0)  # Overlay with some transparency
    
    # Convert the overlay to an image for response
    overlay_image = Image.fromarray(overlay_image)
    
    # Save the result or return the image as response
    img_io = io.BytesIO()
    overlay_image.save(img_io, 'JPEG')
    img_io.seek(0)
    
    return send_file(img_io, mimetype='image/jpeg')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    image = Image.open(io.BytesIO(file.read()))
    preprocessed_image = preprocess_image(image)

    predictions = model.predict(preprocessed_image)
    predicted_class_index = np.argmax(predictions[0])
    confidence = np.max(predictions[0])
    confidence = float(predictions[0][predicted_class_index])
    
    class_name = class_names[predicted_class_index]
    plant_name, health_status = class_name.split('___')

    # Check confidence level and construct response
    if confidence >= 0.7:
        # Extract plant and disease from combined label
        class_name = class_names[predicted_class_index]
        plant_name, health_status = class_name.split('___')  # Split the label

        response = {
            "plant_name": plant_name,
            "health_status": health_status,
            "confidence": confidence,
            "message": "The model is confident about the result."
        }
    else:
        response = {
            "plant_name": plant_name,
            "health_status": health_status,
            "confidence": confidence,
            "message": "The model is not confident about the result."
        }

    return jsonify(response)

@app.route('/gradcam', methods=['POST'])
def gradcam():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    image = Image.open(io.BytesIO(file.read()))
    preprocessed_image = preprocess_image(image)

    # Get heatmap and predicted class index
    heatmap, class_idx = get_gradcam_heatmap(model, preprocessed_image)

    # Convert heatmap to an image
    heatmap = np.uint8(255 * heatmap)  # Scale the heatmap to [0, 255]
    heatmap = Image.fromarray(heatmap)

    # Overlay heatmap on the original image
    image = image.resize((224, 224))  # Resize original image for overlay
    heatmap = heatmap.resize((224, 224))  # Resize heatmap to match image size
    heatmap = np.array(heatmap)  # Convert to array for overlay

    # Create a colormap for the heatmap
    heatmap = plt.cm.jet(heatmap)[:, :, :3]  # Apply jet colormap and drop alpha channel

    # Convert original image to array
    original_image = np.array(image) / 255.0  # Normalize
    overlay_image = 0.6 * original_image + 0.4 * heatmap  # Overlay with some transparency

    # Convert the overlay to an image for response
    overlay_image = Image.fromarray(np.uint8(255 * overlay_image))

    # Save the result or return the image as response
    img_io = io.BytesIO()
    overlay_image.save(img_io, 'PNG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/png')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
