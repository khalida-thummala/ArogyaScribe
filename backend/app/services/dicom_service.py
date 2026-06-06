import pydicom
import numpy as np
from PIL import Image
import io


def dicom_to_png_bytes(dicom_file):

    dicom = pydicom.dcmread(
        io.BytesIO(dicom_file)
    )

    pixel_array = dicom.pixel_array

    # Normalize image
    pixel_array = pixel_array.astype(float)

    pixel_array = (
        np.maximum(pixel_array, 0)
        / pixel_array.max()
    ) * 255.0

    pixel_array = np.uint8(pixel_array)

    image = Image.fromarray(pixel_array)

    image = image.convert("L")

    buffer = io.BytesIO()

    image.save(buffer, format="PNG")

    buffer.seek(0)

    # Extract DICOM metadata
    metadata = {
        "modality": str(
            getattr(dicom, "Modality", "")
        ),

        "body_part": str(
            getattr(dicom, "BodyPartExamined", "")
        ),

        "study_date": str(
            getattr(dicom, "StudyDate", "")
        ),

        "patient_name": str(
            getattr(dicom, "PatientName", "")
        )
    }

    return buffer.read(), metadata