/**
 * Uploads massive banners and profile pictures directly to the cloud.
 * Bypasses Vercel's server payload limit completely.
 */
/**
 * Compresses an image file client-side using HTML5 Canvas to keep it under 2MB.
 */
async function compressImageToJPEG(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Limit maximum dimension to 1920px for modern, clean, web-ready display
        const MAX_DIMENSION = 1920;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn("Could not retrieve 2D context from canvas during image compression");
          return resolve(file);
        }

        // Fill background with solid white (handling transparent PNG transitions to JPEG without black silhouetting)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;

        const getCompressedBlob = (currQuality: number): Promise<Blob | null> => {
          return new Promise((res) => {
            canvas.toBlob((blob) => res(blob), 'image/jpeg', currQuality);
          });
        };

        const attemptCompression = async () => {
          try {
            let blob = await getCompressedBlob(quality);
            if (!blob) {
              return resolve(file);
            }

            // Progressive compression loop to ensure image is under 2MB
            const TWO_MEGABYTES = 2 * 1024 * 1024;
            while (blob && blob.size > TWO_MEGABYTES && quality > 0.1) {
              quality -= 0.1;
              blob = await getCompressedBlob(quality);
            }

            if (blob) {
              const rawName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const compressedFile = new File([blob], `${rawName}_optimized.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(`[Compression Optimizer] Success: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) -> ${compressedFile.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`);
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          } catch (e) {
            console.error("Error compressing image, falling back:", e);
            resolve(file);
          }
        };

        attemptCompression();
      };

      img.onerror = () => {
        console.error("Failed to load image element for compression");
        resolve(file);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      console.error("Failed to read image file data URL");
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads massive banners and profile pictures directly to the cloud.
 * Bypasses Vercel's server payload limit completely.
 */
export async function uploadDirectToCloud(file: File): Promise<string> {
  try {
    // Compress image to a lightweight JPEG under 2MB native in browser memory before sending
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImageToJPEG(file);
    }

    // Step 1: Request the secure upload authorization signature from our backend template server
    const signatureResponse = await fetch('/api/upload/sign', { method: 'POST' });
    const authData = await signatureResponse.json();
    
    if (!authData.success) throw new Error("Cloud signature handshake rejected.");

    // Step 2: Package the compressed image file binary
    const cloudForm = new FormData();
    cloudForm.append('file', fileToUpload);
    cloudForm.append('api_key', authData.apiKey);
    cloudForm.append('timestamp', String(authData.timestamp));
    cloudForm.append('signature', authData.signature);
    cloudForm.append('folder', authData.folder || 'tyrox_brand_assets');

    // Step 3: Stream the image DIRECTLY to Cloudinary's global asset cluster
    // Correct standard Cloudinary endpoint uses api.cloudinary.com/v1_1/:cloud_name/image/upload
    const cloudName = authData.cloudName || "demo";
    const targetUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    console.log(`Uploading direct payload straight to Cloudinary at: ${targetUrl}`);
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: cloudForm
    });

    if (!response.ok) {
      const serverText = await response.text();
      throw new Error(serverText || "Cloud bucket rejected file transfer.");
    }

    const uploadResult = await response.json();
    
    // Returns the flawless, web-optimized URL path to save to your database row
    return uploadResult.secure_url;

  } catch (error: any) {
    console.error("Direct-to-Cloud Storage Pipeline Failure:", error.message || error);
    throw error;
  }
}
