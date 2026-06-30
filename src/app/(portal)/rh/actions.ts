"use server";

async function deleteIdea(id: string) {
  const response = await fetch(`/api/idees/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete idea');
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete idea');
  }
  
  return data;
}
