import { supabase } from '@/lib/supabase';

const BUCKET = 'item-photos';

/** Upload an item photo and return its public URL. */
export async function uploadItemPhoto(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
