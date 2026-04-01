export async function classifyTransaction(description: string) {
  if (description.toLowerCase().includes("uber")) {
    return "Transporte";
  }

  return "Outros";
}