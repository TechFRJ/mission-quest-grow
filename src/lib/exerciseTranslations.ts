// Exercise name translations EN → PT-BR
const TRANSLATIONS: Record<string, string> = {
  // Chest
  "bench press": "Supino Reto",
  "barbell bench press": "Supino com Barra",
  "dumbbell bench press": "Supino com Halteres",
  "incline bench press": "Supino Inclinado",
  "incline dumbbell press": "Supino Inclinado com Halteres",
  "decline bench press": "Supino Declinado",
  "push up": "Flexão de Braço",
  "push-up": "Flexão de Braço",
  "pushup": "Flexão de Braço",
  "wide grip push up": "Flexão Pegada Aberta",
  "diamond push up": "Flexão Diamante",
  "chest fly": "Crucifixo",
  "dumbbell fly": "Crucifixo com Halteres",
  "cable fly": "Crossover na Polia",
  "cable crossover": "Crossover na Polia",
  "chest dip": "Mergulho no Paralelas",
  "dips": "Paralelas",
  "pec deck": "Voador",

  // Back
  "deadlift": "Levantamento Terra",
  "barbell deadlift": "Levantamento Terra com Barra",
  "romanian deadlift": "Levantamento Terra Romeno",
  "sumo deadlift": "Levantamento Terra Sumô",
  "pull up": "Barra Fixa",
  "pull-up": "Barra Fixa",
  "pullup": "Barra Fixa",
  "chin up": "Barra Fixa Pegada Supinada",
  "chin-up": "Barra Fixa Pegada Supinada",
  "lat pulldown": "Puxada na Polia Alta",
  "wide grip lat pulldown": "Puxada Pegada Aberta",
  "close grip lat pulldown": "Puxada Pegada Fechada",
  "cable row": "Remada na Polia",
  "seated cable row": "Remada Sentada na Polia",
  "barbell row": "Remada Curvada com Barra",
  "bent over row": "Remada Curvada",
  "dumbbell row": "Remada com Halter",
  "one arm dumbbell row": "Remada Unilateral com Halter",
  "t-bar row": "Remada Cavalinho",
  "face pull": "Face Pull",
  "shrug": "Encolhimento",
  "barbell shrug": "Encolhimento com Barra",
  "dumbbell shrug": "Encolhimento com Halteres",
  "hyperextension": "Hiperextensão Lombar",
  "back extension": "Extensão Lombar",

  // Legs
  "squat": "Agachamento",
  "barbell squat": "Agachamento com Barra",
  "front squat": "Agachamento Frontal",
  "goblet squat": "Agachamento Goblet",
  "bulgarian split squat": "Agachamento Búlgaro",
  "hack squat": "Hack Squat",
  "leg press": "Leg Press",
  "leg extension": "Cadeira Extensora",
  "leg curl": "Mesa Flexora",
  "lying leg curl": "Mesa Flexora Deitado",
  "seated leg curl": "Cadeira Flexora",
  "calf raise": "Panturrilha em Pé",
  "standing calf raise": "Panturrilha em Pé",
  "seated calf raise": "Panturrilha Sentado",
  "lunges": "Avanço",
  "lunge": "Avanço",
  "walking lunges": "Avanço Andando",
  "dumbbell lunges": "Avanço com Halteres",
  "hip thrust": "Elevação Pélvica",
  "barbell hip thrust": "Elevação Pélvica com Barra",
  "glute bridge": "Ponte Glúteo",
  "step up": "Subida no Banco",
  "good morning": "Bom Dia",

  // Shoulders
  "shoulder press": "Desenvolvimento de Ombros",
  "overhead press": "Desenvolvimento Militar",
  "military press": "Desenvolvimento Militar",
  "dumbbell shoulder press": "Desenvolvimento com Halteres",
  "arnold press": "Desenvolvimento Arnold",
  "lateral raise": "Elevação Lateral",
  "dumbbell lateral raise": "Elevação Lateral com Halteres",
  "front raise": "Elevação Frontal",
  "rear delt fly": "Crucifixo Inverso",
  "reverse fly": "Crucifixo Inverso",
  "upright row": "Remada Alta",

  // Arms - Biceps
  "bicep curl": "Rosca Direta",
  "biceps curl": "Rosca Direta",
  "barbell curl": "Rosca Direta com Barra",
  "dumbbell curl": "Rosca Alternada",
  "hammer curl": "Rosca Martelo",
  "preacher curl": "Rosca Scott",
  "concentration curl": "Rosca Concentrada",
  "cable curl": "Rosca na Polia",
  "incline dumbbell curl": "Rosca Inclinada",

  // Arms - Triceps
  "tricep dip": "Mergulho para Tríceps",
  "tricep extension": "Extensão de Tríceps",
  "triceps extension": "Extensão de Tríceps",
  "tricep pushdown": "Tríceps na Polia",
  "triceps pushdown": "Tríceps na Polia",
  "rope pushdown": "Tríceps Corda",
  "skull crusher": "Tríceps Testa",
  "lying triceps extension": "Tríceps Testa",
  "overhead tricep extension": "Tríceps Francês",
  "close grip bench press": "Supino Pegada Fechada",
  "diamond push up": "Flexão Diamante",

  // Core
  "plank": "Prancha",
  "side plank": "Prancha Lateral",
  "crunch": "Abdominal",
  "sit up": "Abdominal Completo",
  "sit-up": "Abdominal Completo",
  "russian twist": "Russian Twist",
  "leg raise": "Elevação de Pernas",
  "hanging leg raise": "Elevação de Pernas Suspenso",
  "ab wheel": "Roda Abdominal",
  "mountain climber": "Escalador",
  "bicycle crunch": "Abdominal Bicicleta",
  "v-up": "Abdominal V",
  "dead bug": "Dead Bug",
  "bird dog": "Bird Dog",
  "wood chop": "Lenhador",

  // Cardio / Full body
  "burpee": "Burpee",
  "jumping jack": "Polichinelo",
  "box jump": "Salto na Caixa",
  "kettlebell swing": "Balanço com Kettlebell",
  "clean and press": "Clean and Press",
  "thruster": "Thruster",
  "snatch": "Arranco",
  "clean": "Clean",
  "jerk": "Jerk",
  "farmer walk": "Caminhada do Fazendeiro",
  "farmers walk": "Caminhada do Fazendeiro",
};

export function translateExerciseName(name: string | undefined | null): string {
  if (!name) return "";
  const key = name.trim().toLowerCase();
  if (TRANSLATIONS[key]) return TRANSLATIONS[key];
  // try partial / fuzzy: check if any translation key is contained
  for (const [en, pt] of Object.entries(TRANSLATIONS)) {
    if (key === en) return pt;
  }
  // Try removing trailing qualifiers
  const stripped = key.replace(/\s+(barbell|dumbbell|cable|machine|smith)\s*$/i, "").trim();
  if (TRANSLATIONS[stripped]) return TRANSLATIONS[stripped];
  return name;
}

export function getExerciseImageUrl(name: string | undefined | null): string {
  if (!name) return "";
  // free-exercise-db uses underscore-separated lowercase folder names matching the dataset
  const slug = name.trim().replace(/\s+/g, "_");
  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${slug}/0.jpg`;
}
