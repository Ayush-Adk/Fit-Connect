
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

export async function handleStoryUpload(
  supabase: ReturnType<typeof createClient>,
  imageData: string,
  caption: string | null,
  userId: string
) {
  // Extract base64 data
  const base64Data = imageData.split(',')[1];
  const contentType = imageData.split(';')[0].split(':')[1];
  const fileExt = contentType.split('/')[1];
  
  // Convert base64 to Uint8Array
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  
  // Generate a unique filename
  const filename = `${userId}/${crypto.randomUUID()}.${fileExt}`;
  
  // Make sure bucket exists
  try {
    await supabase.storage.createBucket('stories', {
      public: true
    });
  } catch (err) {
    // Bucket might already exist, that's fine
    console.log("Bucket creation error (might already exist):", err);
  }
  
  // Upload the image to storage
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('stories')
    .upload(filename, binaryData, {
      contentType,
      upsert: true
    });
    
  if (uploadError) {
    throw uploadError;
  }
  
  // Get the public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('stories')
    .getPublicUrl(filename);
    
  const imageUrl = publicUrlData.publicUrl;
  
  // Create a new story in the database
  const { data: storyData, error: storyError } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      caption: caption
    })
    .select('id')
    .single();
    
  if (storyError) {
    throw storyError;
  }
  
  return { 
    success: true, 
    story: storyData,
    imageUrl
  };
}
