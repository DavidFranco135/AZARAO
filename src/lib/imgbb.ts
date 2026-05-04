const IMGBB_API_KEY = "24fdf2dc907cc3b17492621921d8af42";

/**
 * Faz upload de um arquivo de imagem para o ImgBB
 * Retorna a URL pública da imagem
 */
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Falha no upload da imagem.");

  const data = await res.json();

  if (!data.success) throw new Error(data.error?.message ?? "Erro no ImgBB.");

  // Retorna a URL de exibição
  return data.data.display_url as string;
};
