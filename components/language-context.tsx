"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type LanguageContextType = {
  language: string
  setLanguage: (language: string) => void
  translations: Record<string, string>
  speechLanguage: string
  interfaceLanguage: string
  availableLanguages: Array<{ code: string; name: string; flag: string; nativeName: string }>
}

// Expanded translations to cover all UI elements
const defaultTranslations: Record<string, Record<string, string>> = {
  "en-US": {
    // App general
    "app.title": "Interactive English Teacher",
    "app.description": "Practice your English skills with our interactive teacher",
    "app.loading": "Loading...",
    "app.error": "An error occurred. Please try again.",

    // Navigation
    "nav.lessons": "Lessons",
    "nav.speaking": "Speaking",
    "nav.vocabulary": "Vocabulary",
    "nav.history": "History",
    "nav.settings": "Settings",

    // Chat interface
    "chat.placeholder": "Type your message in any language...",
    "chat.send": "Send",
    "chat.recording": "Recording...",
    "chat.typing": "is typing...",

    // Vocabulary section
    "vocabulary.title": "Vocabulary Explorer",
    "vocabulary.description": "Words from our conversation. Click on any word to hear its pronunciation.",
    "vocabulary.highlighted": "Highlighted words",
    "vocabulary.difficult": "are more difficult.",
    "vocabulary.refresh": "Refresh",
    "vocabulary.empty": "Start a conversation to see vocabulary words here.",
    "vocabulary.difficulty.basic": "Basic - Common everyday words",
    "vocabulary.difficulty.intermediate": "Intermediate - Academic and professional",
    "vocabulary.difficulty.advanced": "Advanced - Specialized and complex",
    "vocabulary.export": "Export",
    "vocabulary.quiz": "Start Vocabulary Quiz",

    // Teacher responses
    "teacher.greeting": "Hello! I'm your English teacher. How can I help you today?",
    "teacher.assistant": "Your English Learning Assistant",
    "teacher.startSpeaking": "Start Speaking",
    "teacher.stopSpeaking": "Stop Speaking",

    // Speech practice
    "speech.title": "Speech Practice",
    "speech.practice": "Practice",
    "speech.history": "History",
    "speech.settings": "Settings",
    "speech.freePractice": "Free Practice",
    "speech.guidedPractice": "Guided Practice",
    "speech.conversation": "Conversation",
    "speech.speakPrompt": "Speak the prompt",
    "speech.newPractice": "New Practice",
    "speech.noHistory": "No practice history yet. Complete a practice session to see it here.",
    "speech.prompt": "Prompt",
    "speech.response": "Your response",
    "speech.score": "Score",
    "speech.feedback": "Real-time Feedback",
    "speech.feedbackDesc": "Practice your speaking skills with real-time feedback on pronunciation and grammar.",
    "speech.recentPractice": "Recent Practice",
    "speech.practiceModes": "Practice Modes",
    "speech.freeDesc": "Speak freely on any topic",
    "speech.guidedDesc": "Follow structured prompts",
    "speech.conversationDesc": "Practice with the teacher",

    environment: {
      title: "Conversation Environment",
      description: "Select the type of conversation you want to practice",
      casual: "Casual Conversation",
      business: "Business English",
      academic: "Academic English",
      travel: "Travel Situations",
      slang: "Slang & Idioms",
    },

    // Settings
    "settings.voiceAudio": "Voice & Audio",
    "settings.microphone": "Microphone",
    "settings.speaker": "Speaker",
    "settings.enabled": "Enabled",
    "settings.disabled": "Disabled",
    "settings.display": "Display",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.language": "Language",
    "settings.feedbackLevel": "Feedback Level",
    "settings.basic": "Basic",
    "settings.detailed": "Detailed",
    "settings.autoSpeakPrompts": "Auto-Speak Prompts",
    "settings.continuousListening": "Continuous Listening",

    // Language selection
    "language.select": "Select Language",
    "language.current": "Current Language",
    "language.change": "Change Language",
    "language.english": "English",
    "language.portuguese": "Portuguese",
    "language.spanish": "Spanish",
    "language.french": "French",
    "language.german": "German",
    "language.italian": "Italian",
    "language.chinese": "Chinese",
    "language.japanese": "Japanese",
    "language.korean": "Korean",
    "language.russian": "Russian",
    "language.arabic": "Arabic",

    // Buttons and actions
    "button.save": "Save",
    "button.cancel": "Cancel",
    "button.confirm": "Confirm",
    "button.close": "Close",
    "button.apply": "Apply",
    "button.reset": "Reset",
    "button.continue": "Continue",
    "button.back": "Back",
    "button.next": "Next",
    "button.previous": "Previous",

    // Progress and analytics
    "progress.currentProgress": "Current Progress",
    "progress.level": "Level B1",
    "progress.completed": "completed",
    "progress.speakingTime": "Speaking Time",
    "progress.vocabularyUsed": "Vocabulary Used",
    "progress.grammarAccuracy": "Grammar Accuracy",

    // Lesson plan
    "lessons.plan": "Lesson Plan",
    "lessons.current": "Current",
    "lessons.greetings": "Greetings & Introductions",
    "lessons.dailyConversations": "Daily Conversations",
    "lessons.travelVocabulary": "Travel Vocabulary",
    "lessons.businessEnglish": "Business English",
    "lessons.academicWriting": "Academic Writing",

    // User profile
    "profile.student": "Student",
    "profile.learningWith": "Learning with",

    // Word definition
    "word.definition": "Definition",
    "word.examples": "Examples",
    "word.synonyms": "Synonyms",
    "word.antonyms": "Antonyms",
    "word.pronunciation": "Pronunciation",
    "word.partOfSpeech": "Part of Speech",
    "word.etymology": "Etymology",
    "word.translation": "Translation",

    // Language modal
    "modal.selectLanguage": "Select Your Language",
    "modal.interfaceLanguage": "Interface Language",
    "modal.speechLanguage": "Speech Language",
    "modal.learnLanguage": "Language to Learn",
    "modal.applyChanges": "Apply Changes",
  },
  "pt-BR": {
    // App general
    "app.title": "Professor Interativo de Inglês",
    "app.description": "Pratique suas habilidades em inglês com nosso professor interativo",
    "app.loading": "Carregando...",
    "app.error": "Ocorreu um erro. Por favor, tente novamente.",

    // Navigation
    "nav.lessons": "Lições",
    "nav.speaking": "Conversação",
    "nav.vocabulary": "Vocabulário",
    "nav.history": "Histórico",
    "nav.settings": "Configurações",

    // Chat interface
    "chat.placeholder": "Digite sua mensagem em qualquer idioma...",
    "chat.send": "Enviar",
    "chat.recording": "Gravando...",
    "chat.typing": "está digitando...",

    // Vocabulary section
    "vocabulary.title": "Explorador de Vocabulário",
    "vocabulary.description": "Palavras da nossa conversa. Clique em qualquer palavra para ouvir sua pronúncia.",
    "vocabulary.highlighted": "Palavras destacadas",
    "vocabulary.difficult": "são mais difíceis.",
    "vocabulary.refresh": "Atualizar",
    "vocabulary.empty": "Inicie uma conversa para ver palavras de vocabulário aqui.",
    "vocabulary.difficulty.basic": "Básico - Palavras comuns do dia a dia",
    "vocabulary.difficulty.intermediate": "Intermediário - Acadêmico e profissional",
    "vocabulary.difficulty.advanced": "Avançado - Especializado e complexo",
    "vocabulary.export": "Exportar",
    "vocabulary.quiz": "Iniciar Quiz de Vocabulário",

    // Teacher responses
    "teacher.greeting": "Olá! Eu sou seu professor de inglês. Como posso ajudá-lo hoje?",
    "teacher.assistant": "Seu Assistente de Aprendizado de Inglês",
    "teacher.startSpeaking": "Começar a Falar",
    "teacher.stopSpeaking": "Parar de Falar",

    // Speech practice
    "speech.title": "Prática de Conversação",
    "speech.practice": "Praticar",
    "speech.history": "Histórico",
    "speech.settings": "Configurações",
    "speech.freePractice": "Prática Livre",
    "speech.guidedPractice": "Prática Guiada",
    "speech.conversation": "Conversação",
    "speech.speakPrompt": "Falar o prompt",
    "speech.newPractice": "Nova Prática",
    "speech.noHistory": "Ainda não há histórico de prática. Complete uma sessão de prática para vê-la aqui.",
    "speech.prompt": "Prompt",
    "speech.response": "Sua resposta",
    "speech.score": "Pontuação",
    "speech.feedback": "Feedback em Tempo Real",
    "speech.feedbackDesc": "Pratique suas habilidades de fala com feedback em tempo real sobre pronúncia e gramática.",
    "speech.recentPractice": "Prática Recente",
    "speech.practiceModes": "Modos de Prática",
    "speech.freeDesc": "Fale livremente sobre qualquer tópico",
    "speech.guidedDesc": "Siga prompts estruturados",
    "speech.conversationDesc": "Pratique com o professor",

    environment: {
      title: "Ambiente de Conversação",
      description: "Selecione o tipo de conversa que deseja praticar",
      casual: "Conversa Casual",
      business: "Inglês para Negócios",
      academic: "Inglês Acadêmico",
      travel: "Situações de Viagem",
      slang: "Gírias e Expressões Idiomáticas",
    },

    // Settings
    "settings.voiceAudio": "Voz e Áudio",
    "settings.microphone": "Microfone",
    "settings.speaker": "Alto-falante",
    "settings.enabled": "Ativado",
    "settings.disabled": "Desativado",
    "settings.display": "Exibição",
    "settings.light": "Claro",
    "settings.dark": "Escuro",
    "settings.language": "Idioma",
    "settings.feedbackLevel": "Nível de Feedback",
    "settings.basic": "Básico",
    "settings.detailed": "Detalhado",
    "settings.autoSpeakPrompts": "Falar Prompts Automaticamente",
    "settings.continuousListening": "Escuta Contínua",

    // Language selection
    "language.select": "Selecionar Idioma",
    "language.current": "Idioma Atual",
    "language.change": "Mudar Idioma",
    "language.english": "Inglês",
    "language.portuguese": "Português",
    "language.spanish": "Espanhol",
    "language.french": "Francês",
    "language.german": "Alemão",
    "language.italian": "Italiano",
    "language.chinese": "Chinês",
    "language.japanese": "Japonês",
    "language.korean": "Coreano",
    "language.russian": "Russo",
    "language.arabic": "Árabe",

    // Buttons and actions
    "button.save": "Salvar",
    "button.cancel": "Cancelar",
    "button.confirm": "Confirmar",
    "button.close": "Fechar",
    "button.apply": "Aplicar",
    "button.reset": "Redefinir",
    "button.continue": "Continuar",
    "button.back": "Voltar",
    "button.next": "Próximo",
    "button.previous": "Anterior",

    // Progress and analytics
    "progress.currentProgress": "Progresso Atual",
    "progress.level": "Nível B1",
    "progress.completed": "concluído",
    "progress.speakingTime": "Tempo de Fala",
    "progress.vocabularyUsed": "Vocabulário Utilizado",
    "progress.grammarAccuracy": "Precisão Gramatical",

    // Lesson plan
    "lessons.plan": "Plano de Aulas",
    "lessons.current": "Atual",
    "lessons.greetings": "Saudações e Apresentações",
    "lessons.dailyConversations": "Conversas Diárias",
    "lessons.travelVocabulary": "Vocabulário de Viagem",
    "lessons.businessEnglish": "Inglês para Negócios",
    "lessons.academicWriting": "Escrita Acadêmica",

    // User profile
    "profile.student": "Estudante",
    "profile.learningWith": "Aprendendo com",

    // Word definition
    "word.definition": "Definição",
    "word.examples": "Exemplos",
    "word.synonyms": "Sinônimos",
    "word.antonyms": "Antônimos",
    "word.pronunciation": "Pronúncia",
    "word.partOfSpeech": "Classe Gramatical",
    "word.etymology": "Etimologia",
    "word.translation": "Tradução",

    // Language modal
    "modal.selectLanguage": "Selecione Seu Idioma",
    "modal.interfaceLanguage": "Idioma da Interface",
    "modal.speechLanguage": "Idioma de Fala",
    "modal.learnLanguage": "Idioma para Aprender",
    "modal.applyChanges": "Aplicar Alterações",
  },
  "es-ES": {
    // App general
    "app.title": "Profesor Interactivo de Inglés",
    "app.description": "Practica tus habilidades en inglés con nuestro profesor interactivo",
    "app.loading": "Cargando...",
    "app.error": "Se produjo un error. Por favor, inténtalo de nuevo.",

    // Navigation
    "nav.lessons": "Lecciones",
    "nav.speaking": "Conversación",
    "nav.vocabulary": "Vocabulario",
    "nav.history": "Historial",
    "nav.settings": "Configuración",

    // Chat interface
    "chat.placeholder": "Escribe tu mensaje en cualquier idioma...",
    "chat.send": "Enviar",
    "chat.recording": "Grabando...",
    "chat.typing": "está escribiendo...",

    // Vocabulary section
    "vocabulary.title": "Explorador de Vocabulario",
    "vocabulary.description":
      "Palabras de nuestra conversación. Haz clic en cualquier palabra para escuchar su pronunciación.",
    "vocabulary.highlighted": "Palabras destacadas",
    "vocabulary.difficult": "son más difíciles.",
    "vocabulary.refresh": "Actualizar",
    "vocabulary.empty": "Inicia una conversación para ver palabras de vocabulario aquí.",
    "vocabulary.difficulty.basic": "Básico - Palabras comunes del día a día",
    "vocabulary.difficulty.intermediate": "Intermedio - Académico y profesional",
    "vocabulary.difficulty.advanced": "Avanzado - Especializado y complejo",
    "vocabulary.export": "Exportar",
    "vocabulary.quiz": "Iniciar Cuestionario de Vocabulario",

    // Teacher responses
    "teacher.greeting": "¡Hola! Soy tu profesor de inglés. ¿Cómo puedo ayudarte hoy?",
    "teacher.assistant": "Tu Asistente de Aprendizaje de Inglés",
    "teacher.startSpeaking": "Empezar a Hablar",
    "teacher.stopSpeaking": "Dejar de Hablar",

    // Speech practice
    "speech.title": "Práctica de Conversación",
    "speech.practice": "Practicar",
    "speech.history": "Historial",
    "speech.settings": "Configuración",
    "speech.freePractice": "Práctica Libre",
    "speech.guidedPractice": "Práctica Guiada",
    "speech.conversation": "Conversación",
    "speech.speakPrompt": "Hablar el prompt",
    "speech.newPractice": "Nueva Práctica",
    "speech.noHistory": "Aún no hay historial de práctica. Completa una sesión de práctica para verla aquí.",
    "speech.prompt": "Prompt",
    "speech.response": "Tu respuesta",
    "speech.score": "Puntuación",
    "speech.feedback": "Retroalimentación en Tiempo Real",
    "speech.feedbackDesc":
      "Practica tus habilidades de habla con retroalimentación en tiempo real sobre pronunciación y gramática.",
    "speech.recentPractice": "Práctica Reciente",
    "speech.practiceModes": "Modos de Práctica",
    "speech.freeDesc": "Habla libremente sobre cualquier tema",
    "speech.guidedDesc": "Sigue prompts estructurados",
    "speech.conversationDesc": "Practica con el profesor",

    // Settings
    "settings.voiceAudio": "Voz y Audio",
    "settings.microphone": "Micrófono",
    "settings.speaker": "Altavoz",
    "settings.enabled": "Activado",
    "settings.disabled": "Desactivado",
    "settings.display": "Visualización",
    "settings.light": "Claro",
    "settings.dark": "Oscuro",
    "settings.language": "Idioma",
    "settings.feedbackLevel": "Nivel de Retroalimentación",
    "settings.basic": "Básico",
    "settings.detailed": "Detallado",
    "settings.autoSpeakPrompts": "Hablar Prompts Automáticamente",
    "settings.continuousListening": "Escucha Continua",

    // Language selection
    "language.select": "Seleccionar Idioma",
    "language.current": "Idioma Actual",
    "language.change": "Cambiar Idioma",
    "language.english": "Inglés",
    "language.portuguese": "Portugués",
    "language.spanish": "Español",
    "language.french": "Francés",
    "language.german": "Alemán",
    "language.italian": "Italiano",
    "language.chinese": "Chino",
    "language.japanese": "Japonés",
    "language.korean": "Coreano",
    "language.russian": "Ruso",
    "language.arabic": "Árabe",

    // Buttons and actions
    "button.save": "Guardar",
    "button.cancel": "Cancelar",
    "button.confirm": "Confirmar",
    "button.close": "Cerrar",
    "button.apply": "Aplicar",
    "button.reset": "Restablecer",
    "button.continue": "Continuar",
    "button.back": "Atrás",
    "button.next": "Siguiente",
    "button.previous": "Anterior",

    // Progress and analytics
    "progress.currentProgress": "Progreso Actual",
    "progress.level": "Nivel B1",
    "progress.completed": "completado",
    "progress.speakingTime": "Tiempo de Habla",
    "progress.vocabularyUsed": "Vocabulario Utilizado",
    "progress.grammarAccuracy": "Precisión Gramatical",

    // Lesson plan
    "lessons.plan": "Plan de Lecciones",
    "lessons.current": "Actual",
    "lessons.greetings": "Saludos y Presentaciones",
    "lessons.dailyConversations": "Conversaciones Diarias",
    "lessons.travelVocabulary": "Vocabulario de Viaje",
    "lessons.businessEnglish": "Inglés para Negocios",
    "lessons.academicWriting": "Escritura Académica",

    // User profile
    "profile.student": "Estudiante",
    "profile.learningWith": "Aprendiendo con",

    // Word definition
    "word.definition": "Definición",
    "word.examples": "Ejemplos",
    "word.synonyms": "Sinónimos",
    "word.antonyms": "Antónimos",
    "word.pronunciation": "Pronunciación",
    "word.partOfSpeech": "Clase Gramatical",
    "word.etymology": "Etimología",
    "word.translation": "Traducción",

    // Language modal
    "modal.selectLanguage": "Selecciona Tu Idioma",
    "modal.interfaceLanguage": "Idioma de la Interfaz",
    "modal.speechLanguage": "Idioma de Habla",
    "modal.learnLanguage": "Idioma para Aprender",
    "modal.applyChanges": "Aplicar Cambios",
  },
  "fr-FR": {
    // App general
    "app.title": "Professeur d'Anglais Interactif",
    "app.description": "Pratiquez votre anglais avec notre professeur interactif",
    "app.loading": "Chargement...",
    "app.error": "Une erreur s'est produite. Veuillez réessayer.",

    // Navigation
    "nav.lessons": "Leçons",
    "nav.speaking": "Conversation",
    "nav.vocabulary": "Vocabulaire",
    "nav.history": "Historique",
    "nav.settings": "Paramètres",

    // Chat interface
    "chat.placeholder": "Tapez votre message dans n'importe quelle langue...",
    "chat.send": "Envoyer",
    "chat.recording": "Enregistrement...",
    "chat.typing": "est en train d'écrire...",

    // Vocabulary section
    "vocabulary.title": "Explorateur de Vocabulaire",
    "vocabulary.description":
      "Mots de notre conversation. Cliquez sur n'importe quel mot pour entendre sa prononciation.",
    "vocabulary.highlighted": "Les mots surlignés",
    "vocabulary.difficult": "sont plus difficiles.",
    "vocabulary.refresh": "Actualiser",
    "vocabulary.empty": "Commencez une conversation pour voir les mots de vocabulaire ici.",
    "vocabulary.difficulty.basic": "Basique - Mots courants du quotidien",
    "vocabulary.difficulty.intermediate": "Intermédiaire - Académique et professionnel",
    "vocabulary.difficulty.advanced": "Avancé - Spécialisé et complexe",
    "vocabulary.export": "Exporter",
    "vocabulary.quiz": "Commencer le Quiz de Vocabulaire",

    // Teacher responses
    "teacher.greeting": "Bonjour ! Je suis votre professeur d'anglais. Comment puis-je vous aider aujourd'hui ?",
    "teacher.assistant": "Votre Assistant d'Apprentissage d'Anglais",
    "teacher.startSpeaking": "Commencer à Parler",
    "teacher.stopSpeaking": "Arrêter de Parler",

    // Speech practice
    "speech.title": "Pratique de Conversation",
    "speech.practice": "Pratiquer",
    "speech.history": "Historique",
    "speech.settings": "Paramètres",
    "speech.freePractice": "Pratique Libre",
    "speech.guidedPractice": "Pratique Guidée",
    "speech.conversation": "Conversation",
    "speech.speakPrompt": "Parler le prompt",
    "speech.newPractice": "Nouvelle Pratique",
    "speech.noHistory": "Pas encore d'historique de pratique. Complétez une session de pratique pour la voir ici.",
    "speech.prompt": "Prompt",
    "speech.response": "Votre réponse",
    "speech.score": "Score",
    "speech.feedback": "Retour en Temps Réel",
    "speech.feedbackDesc":
      "Pratiquez vos compétences orales avec un retour en temps réel sur la prononciation et la grammaire.",
    "speech.recentPractice": "Pratique Récente",
    "speech.practiceModes": "Modes de Pratique",
    "speech.freeDesc": "Parlez librement sur n'importe quel sujet",
    "speech.guidedDesc": "Suivez des prompts structurés",
    "speech.conversationDesc": "Pratiquez avec le professeur",

    // Settings
    "settings.voiceAudio": "Voix et Audio",
    "settings.microphone": "Microphone",
    "settings.speaker": "Haut-parleur",
    "settings.enabled": "Activé",
    "settings.disabled": "Désactivé",
    "settings.display": "Affichage",
    "settings.light": "Clair",
    "settings.dark": "Sombre",
    "settings.language": "Langue",
    "settings.feedbackLevel": "Niveau de Retour",
    "settings.basic": "Basique",
    "settings.detailed": "Détaillé",
    "settings.autoSpeakPrompts": "Parler les Prompts Automatiquement",
    "settings.continuousListening": "Écoute Continue",

    // Language selection
    "language.select": "Sélectionner la Langue",
    "language.current": "Langue Actuelle",
    "language.change": "Changer de Langue",
    "language.english": "Anglais",
    "language.portuguese": "Portugais",
    "language.spanish": "Espagnol",
    "language.french": "Français",
    "language.german": "Allemand",
    "language.italian": "Italien",
    "language.chinese": "Chinois",
    "language.japanese": "Japonais",
    "language.korean": "Coréen",
    "language.russian": "Russe",
    "language.arabic": "Arabe",

    // Buttons and actions
    "button.save": "Enregistrer",
    "button.cancel": "Annuler",
    "button.confirm": "Confirmer",
    "button.close": "Fermer",
    "button.apply": "Appliquer",
    "button.reset": "Réinitialiser",
    "button.continue": "Continuer",
    "button.back": "Retour",
    "button.next": "Suivant",
    "button.previous": "Précédent",

    // Progress and analytics
    "progress.currentProgress": "Progrès Actuel",
    "progress.level": "Niveau B1",
    "progress.completed": "complété",
    "progress.speakingTime": "Temps de Parole",
    "progress.vocabularyUsed": "Vocabulaire Utilisé",
    "progress.grammarAccuracy": "Précision Grammaticale",

    // Lesson plan
    "lessons.plan": "Plan de Leçons",
    "lessons.current": "Actuel",
    "lessons.greetings": "Salutations et Présentations",
    "lessons.dailyConversations": "Conversations Quotidiennes",
    "lessons.travelVocabulary": "Vocabulaire de Voyage",
    "lessons.businessEnglish": "Anglais des Affaires",
    "lessons.academicWriting": "Écriture Académique",

    // User profile
    "profile.student": "Étudiant",
    "profile.learningWith": "Apprend avec",

    // Word definition
    "word.definition": "Définition",
    "word.examples": "Exemples",
    "word.synonyms": "Synonymes",
    "word.antonyms": "Antonymes",
    "word.pronunciation": "Prononciation",
    "word.partOfSpeech": "Partie du Discours",
    "word.etymology": "Étymologie",
    "word.translation": "Traduction",

    // Language modal
    "modal.selectLanguage": "Sélectionnez Votre Langue",
    "modal.interfaceLanguage": "Langue de l'Interface",
    "modal.speechLanguage": "Langue de Parole",
    "modal.learnLanguage": "Langue à Apprendre",
    "modal.applyChanges": "Appliquer les Changements",
  },
}

// List of available languages
const availableLanguages = [
  { code: "en-US", name: "English", flag: "🇺🇸", nativeName: "English" },
  { code: "pt-BR", name: "Portuguese", flag: "🇧🇷", nativeName: "Português" },
  { code: "es-ES", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { code: "fr-FR", name: "French", flag: "🇫🇷", nativeName: "Français" },
]

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>("en-US")
  const [translations, setTranslations] = useState<Record<string, string>>(defaultTranslations["en-US"])
  const [speechLanguage, setSpeechLanguage] = useState<string>("en-US")
  const [interfaceLanguage, setInterfaceLanguage] = useState<string>("en-US")

  // Load language preference from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("preferredLanguage")
      if (savedLanguage && defaultTranslations[savedLanguage]) {
        setLanguageState(savedLanguage)
        setTranslations(defaultTranslations[savedLanguage])
        setSpeechLanguage(savedLanguage)
        setInterfaceLanguage(savedLanguage)
      }
    }
  }, [])

  // Update translations when language changes
  const setLanguage = (newLanguage: string) => {
    if (defaultTranslations[newLanguage]) {
      setLanguageState(newLanguage)
      setTranslations(defaultTranslations[newLanguage])
      setSpeechLanguage(newLanguage)
      setInterfaceLanguage(newLanguage)

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("preferredLanguage", newLanguage)
      }
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translations,
        speechLanguage,
        interfaceLanguage,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export function useTranslation() {
  const { translations } = useLanguage()

  return (key: string, fallback?: string) => {
    return translations[key] || fallback || key
  }
}
