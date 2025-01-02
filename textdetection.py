import cv2
import pytesseract
import numpy as np

# Path to Tesseract executable
pytesseract.pytesseract.tesseract_cmd = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'

# Initialize webcam (0 is the default camera)
cap = cv2.VideoCapture(0)

while True:
    # Capture each frame from the webcam
    ret, frame = cap.read()

    if not ret:
        print("Failed to grab frame")
        break

    # Display the webcam feed
    cv2.imshow('Press Spacebar to Capture', frame)

    # Wait for a key press (in milliseconds)
    key = cv2.waitKey(1) & 0xFF

    if key == 32:  # Spacebar ASCII code is 32
        # Convert the captured image to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian Blur to reduce noise
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # Apply adaptive thresholding to make text stand out more
        thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                      cv2.THRESH_BINARY, 11, 2)

        # Optionally apply a dilation to strengthen the text (useful for thin text)
        kernel = np.ones((2, 2), np.uint8)
        dilated = cv2.dilate(thresh, kernel, iterations=1)

        # Use pytesseract to extract text from the preprocessed image
        extracted_text = pytesseract.image_to_string(dilated, config='--psm 6')

        # Print the extracted text
        print("Extracted Text:", extracted_text)

        # Optionally, display the preprocessed image for debugging
        cv2.imshow('Processed Image', dilated)

        # Optionally, overlay the extracted text on the original frame
        cv2.putText(frame, extracted_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        # Show the captured image with the extracted text
        cv2.imshow('Captured Image with Text', frame)

        # Wait for any key press to close the window
        cv2.waitKey(0)

        break

    # If the 'q' key is pressed, exit the loop (in case you want to exit early)
    elif key == ord('q'):
        break

# Release the webcam and close any OpenCV windows
cap.release()
cv2.destroyAllWindows()
