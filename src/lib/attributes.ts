// Attribute system: maps mission categories to RPG attributes
export const ATTRIBUTES = [
  { key: 'programming', label: 'Programação', icon: '💻', color: 'hsl(271, 81%, 60%)' },
  { key: 'math', label: 'Matemática', icon: '🧮', color: 'hsl(200, 80%, 55%)' },
  { key: 'health', label: 'Saúde', icon: '💪', color: 'hsl(152, 69%, 42%)' },
  { key: 'reading', label: 'Leitura', icon: '📚', color: 'hsl(43, 96%, 56%)' },
  { key: 'spiritual', label: 'Espiritual', icon: '🧘', color: 'hsl(280, 60%, 65%)' },
  { key: 'projects', label: 'Projetos', icon: '🚀', color: 'hsl(15, 90%, 55%)' },
  { key: 'discipline', label: 'Disciplina', icon: '🎯', color: 'hsl(210, 70%, 50%)' },
] as const;

export type AttributeKey = typeof ATTRIBUTES[number]['key'];

// Map common category names to attributes
const CATEGORY_MAP: Record<string, AttributeKey> = {
  // Programming
  'programação': 'programming', 'programacao': 'programming', 'código': 'programming',
  'codigo': 'programming', 'dev': 'programming', 'desenvolvimento': 'programming',
  'python': 'programming', 'javascript': 'programming', 'react': 'programming',
  'coding': 'programming', 'tech': 'programming', 'tecnologia': 'programming',
  // Math
  'matemática': 'math', 'matematica': 'math', 'math': 'math', 'cálculo': 'math',
  'calculo': 'math', 'estatística': 'math', 'estatistica': 'math',
  // Health
  'saúde': 'health', 'saude': 'health', 'exercício': 'health', 'exercicio': 'health',
  'treino': 'health', 'academia': 'health', 'fitness': 'health', 'corrida': 'health',
  'alimentação': 'health', 'alimentacao': 'health', 'sono': 'health', 'health': 'health',
  // Reading
  'leitura': 'reading', 'livro': 'reading', 'livros': 'reading', 'reading': 'reading',
  'estudo': 'reading', 'estudos': 'reading', 'aprendizado': 'reading',
  // Spiritual
  'espiritual': 'spiritual', 'meditação': 'spiritual', 'meditacao': 'spiritual',
  'oração': 'spiritual', 'oracao': 'spiritual', 'mindfulness': 'spiritual',
  'gratidão': 'spiritual', 'gratidao': 'spiritual',
  // Projects
  'projeto': 'projects', 'projetos': 'projects', 'projects': 'projects',
  'trabalho': 'projects', 'freelance': 'projects', 'side project': 'projects',
  // Discipline
  'disciplina': 'discipline', 'rotina': 'discipline', 'organização': 'discipline',
  'organizacao': 'discipline', 'produtividade': 'discipline', 'foco': 'discipline',
  'hábito': 'discipline', 'habito': 'discipline', 'discipline': 'discipline',
};

export function categoryToAttribute(category: string): AttributeKey {
  const normalized = category.toLowerCase().trim();
  return CATEGORY_MAP[normalized] || 'discipline';
}

export function getAttributeInfo(key: AttributeKey) {
  return ATTRIBUTES.find(a => a.key === key)!;
}
