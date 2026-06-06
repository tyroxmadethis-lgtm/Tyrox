/**
 * Uploads massive banners and profile pictures directly to the cloud.
 * Bypasses Vercel's server payload limit completely.
 */
export async function uploadDirectToCloud(file: File): Promise<string> {
  try {
    // Step 1: Request the secure upload authorization signature from our backend template server
    const signatureResponse = await fetch('/api/upload/sign', { method: 'POST' });
    const authData = await signatureResponse.json();
    
    if (!authData.success) throw new Error("Cloud signature handshake rejected.");

    // Step 2: Package the raw, untouched image file binary
    const cloudForm = new FormData();
    cloudForm.append('file', file);
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
    
    // Returns the flawless, full-resolution URL path to save to your database row
    return uploadResult.secure_url;

  } catch (error: any) {
    console.error("Direct-to-Cloud Storage Pipeline Failure:", error.message || error);
    throw error;
  }
}
