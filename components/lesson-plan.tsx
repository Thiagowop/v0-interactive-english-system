"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle2, BookOpen, Headphones, MessageCircle, GraduationCap, Clock, Award } from "lucide-react"

export default function LessonPlan() {
  const [selectedLevel, setSelectedLevel] = useState("pre-a1")

  const levels = [
    { id: "pre-a1", name: "Pre-A1", color: "bg-gray-500", icon: "🔰" },
    { id: "a1", name: "A1", color: "bg-green-500", icon: "🟢" },
    { id: "a2", name: "A2", color: "bg-yellow-500", icon: "🟡" },
    { id: "b1", name: "B1", color: "bg-blue-500", icon: "🔵" },
    { id: "b2", name: "B2", color: "bg-purple-500", icon: "🟣" },
    { id: "c1", name: "C1", color: "bg-amber-800", icon: "🟤" },
    { id: "c2", name: "C2", color: "bg-black", icon: "⚫" },
  ]

  const modules = {
    "pre-a1": [
      {
        title: "Alphabet and Basic Sounds",
        description: "Introduction to English alphabet and phonetics",
        objectives: [
          "Recognize and pronounce all 26 letters of the English alphabet",
          "Identify and produce basic English phonemes",
          "Distinguish between similar sounds like /æ/, /ʌ/, /iː/",
        ],
        activities: [
          "Alphabet song and repetition exercises",
          "Phonetic bingo with sound recognition",
          "Minimal pairs practice with audio support",
        ],
        assessment: "Phoneme recognition quiz and alphabet recitation",
      },
      {
        title: "First Words and Greetings",
        description: "Essential vocabulary for basic communication",
        objectives: [
          "Use common greetings (hello, hi, good morning)",
          "Count from 1 to 20",
          "Identify and name basic colors",
          "Recognize family member terms",
        ],
        activities: [
          "Role-play greeting scenarios",
          "Color identification games",
          "Family tree creation with labels",
          "Number sequence activities",
        ],
        assessment: "Picture-word matching test and oral greeting demonstration",
      },
      {
        title: "Simple Conversations",
        description: "Basic interaction patterns",
        objectives: [
          "Introduce yourself with name and age",
          "Ask and answer 'What's your name?'",
          "Recognize basic instructions in English",
        ],
        activities: [
          "Name game circle activities",
          "Partner introduction practice",
          "Simon Says for instruction following",
          "Listen and point exercises",
        ],
        assessment: "Simple dialogue performance and listening comprehension check",
      },
    ],
    a1: [
      {
        title: "The Verb 'To Be'",
        description: "Foundation of English sentence structure",
        objectives: [
          "Use 'to be' in affirmative, negative, and question forms",
          "Form simple sentences about identity and states",
          "Ask yes/no questions with 'to be'",
        ],
        activities: [
          "Sentence transformation exercises",
          "Identity card creation with self-description",
          "Question formation practice",
          "Information gap activities",
        ],
        assessment: "Written quiz on 'to be' forms and oral interview using the verb",
      },
      {
        title: "Daily Routines",
        description: "Simple Present tense for habitual actions",
        objectives: [
          "Use Simple Present for daily activities",
          "Tell time and discuss schedules",
          "Describe weekly routines",
        ],
        activities: [
          "Daily schedule creation",
          "Time telling practice",
          "Weekly calendar completion",
          "Routine comparison in pairs",
        ],
        assessment: "Daily routine presentation and Simple Present fill-in-the-blank test",
      },
      {
        title: "My World",
        description: "Describing immediate surroundings",
        objectives: [
          "Use articles (a, an, the) correctly",
          "Employ personal and possessive pronouns",
          "Name objects in the classroom and home",
        ],
        activities: [
          "Classroom scavenger hunt",
          "Home drawing with labels",
          "Pronoun replacement exercises",
          "Article sorting games",
        ],
        assessment: "Picture description task and article/pronoun quiz",
      },
    ],
    a2: [
      {
        title: "Past Experiences",
        description: "Simple Past tense for completed actions",
        objectives: [
          "Form regular and irregular past tense verbs",
          "Narrate simple past events",
          "Ask and answer questions about past activities",
        ],
        activities: [
          "Irregular verb memory games",
          "Weekend activity recounting",
          "Past tense story chain",
          "Interview about childhood experiences",
        ],
        assessment: "Past tense narrative writing and irregular verb quiz",
      },
      {
        title: "Describing Places",
        description: "Existence and location expressions",
        objectives: [
          "Use 'there is/are' for existence",
          "Apply 'some/any' with countable and uncountable nouns",
          "Employ prepositions of place correctly",
        ],
        activities: [
          "Room description tasks",
          "City map navigation exercises",
          "Quantity expression practice",
          "Preposition picture games",
        ],
        assessment: "Picture description test and preposition fill-in-the-blank quiz",
      },
      {
        title: "Actions in Progress",
        description: "Present Continuous vs. Simple Present",
        objectives: [
          "Form Present Continuous correctly",
          "Distinguish between habitual and current actions",
          "Describe ongoing activities",
        ],
        activities: [
          "Action mime and guess games",
          "Picture description of current activities",
          "Tense contrast exercises",
          "Daily vs. current activity sorting",
        ],
        assessment: "Tense choice quiz and picture-based speaking test",
      },
    ],
    b1: [
      {
        title: "Future Plans and Predictions",
        description: "Future expressions with 'will' and 'going to'",
        objectives: [
          "Differentiate between 'will' and 'going to'",
          "Express future plans and intentions",
          "Make predictions about future events",
        ],
        activities: [
          "Future timeline creation",
          "Prediction game about classmates",
          "Weekend plan discussion",
          "Weather forecast role-play",
        ],
        assessment: "Future form selection quiz and oral presentation of plans",
      },
      {
        title: "Life Experiences",
        description: "Present Perfect for life experiences",
        objectives: [
          "Form Present Perfect with regular and irregular participles",
          "Discuss life experiences with 'ever' and 'never'",
          "Contrast Simple Past and Present Perfect",
        ],
        activities: [
          "Experience survey with classmates",
          "Bucket list creation",
          "Famous person biography exploration",
          "Tense contrast exercises",
        ],
        assessment: "Present Perfect vs. Simple Past quiz and experience interview",
      },
      {
        title: "Comparisons and Advice",
        description: "Comparative structures and modal verbs",
        objectives: [
          "Form comparative and superlative adjectives",
          "Use modals (can, should, must) for ability, advice, and obligation",
          "Compare places, products, and experiences",
        ],
        activities: [
          "Product comparison presentations",
          "City or country ranking activities",
          "Advice column role-play",
          "Modal verb situation cards",
        ],
        assessment: "Comparative writing task and modal verb scenario quiz",
      },
    ],
    b2: [
      {
        title: "Passive Voice and Causatives",
        description: "Alternative sentence structures",
        objectives: [
          "Transform active sentences to passive voice",
          "Use passive voice across different tenses",
          "Express causative arrangements with 'have/get something done'",
        ],
        activities: [
          "News headline transformation",
          "Process description using passive",
          "Service arrangement role-plays",
          "Passive voice tense timeline",
        ],
        assessment: "Active-passive transformation test and causative situation writing",
      },
      {
        title: "Hypothetical Situations",
        description: "Conditional clauses (0, 1, and 2)",
        objectives: [
          "Form and use zero, first, and second conditionals",
          "Express general truths, likely futures, and hypothetical presents",
          "Discuss causes and effects",
        ],
        activities: [
          "Conditional chain stories",
          "Advice giving with second conditional",
          "Science fact discussion with zero conditional",
          "Future possibility debates",
        ],
        assessment: "Conditional completion quiz and hypothetical situation discussion",
      },
      {
        title: "Reported Speech and Phrasal Verbs",
        description: "Advanced reporting and idiomatic expressions",
        objectives: [
          "Convert direct speech to reported speech",
          "Apply backshift rules across tenses",
          "Recognize and use common phrasal verbs",
        ],
        activities: [
          "Gossip chain reporting game",
          "News reporting exercises",
          "Phrasal verb matching activities",
          "Context-based phrasal verb replacement",
        ],
        assessment: "Reported speech transformation test and phrasal verb usage quiz",
      },
    ],
    c1: [
      {
        title: "Advanced Conditionals",
        description: "Third conditional and mixed conditionals",
        objectives: [
          "Form third conditional for past hypotheticals",
          "Create mixed conditionals across time frames",
          "Express regrets and alternative past outcomes",
        ],
        activities: [
          "Historical 'what if' discussions",
          "Personal regret reflection",
          "Mixed conditional situation cards",
          "Alternative history creative writing",
        ],
        assessment: "Conditional formation test and hypothetical situation essay",
      },
      {
        title: "Emphasis and Inversion",
        description: "Advanced sentence structures for emphasis",
        objectives: [
          "Use cleft sentences for emphasis",
          "Apply negative inversions (Never have I...)",
          "Employ advanced connectors (moreover, nevertheless)",
        ],
        activities: [
          "Emphasis transformation exercises",
          "Formal speech writing with inversions",
          "Connector classification and usage",
          "Emphatic response practice",
        ],
        assessment: "Sentence transformation test and formal presentation using emphasis structures",
      },
      {
        title: "Idiomatic and Academic Language",
        description: "Advanced vocabulary and expressions",
        objectives: [
          "Use common idioms and collocations appropriately",
          "Employ academic vocabulary in context",
          "Distinguish nuances of meaning",
        ],
        activities: [
          "Idiom origin research and presentation",
          "Academic abstract analysis",
          "Synonym nuance sorting",
          "Collocation completion exercises",
        ],
        assessment: "Idiom usage test and academic paragraph writing",
      },
    ],
    c2: [
      {
        title: "Complex Grammatical Structures",
        description: "Mastery of advanced grammar",
        objectives: [
          "Apply all tenses and aspects with precision",
          "Use subjunctive and complex hypothetical structures",
          "Master indirect styles in various contexts",
        ],
        activities: [
          "Literary excerpt analysis",
          "Complex narrative tense sequencing",
          "Subjunctive in formal writing practice",
          "Style shifting exercises",
        ],
        assessment: "Advanced grammar error correction and complex structure production",
      },
      {
        title: "Specialized and Literary Vocabulary",
        description: "Sophisticated lexical resource development",
        objectives: [
          "Use academic and literary vocabulary appropriately",
          "Employ rare words and formal registers",
          "Apply euphemisms and specialized gerunds",
        ],
        activities: [
          "Academic journal article analysis",
          "Literary style imitation writing",
          "Register shifting exercises",
          "Specialized field vocabulary research",
        ],
        assessment: "Advanced vocabulary usage essay and register appropriateness analysis",
      },
      {
        title: "Critical Listening and Speaking",
        description: "Highest level comprehension and production",
        objectives: [
          "Analyze complex audio including films and lectures",
          "Critically evaluate spoken discourse",
          "Produce extended academic speeches",
          "Perform basic simultaneous translation",
        ],
        activities: [
          "Film clip critical analysis",
          "Academic lecture note-taking",
          "Formal debate participation",
          "Impromptu speech delivery",
        ],
        assessment: "Critical listening analysis and extended academic presentation",
      },
    ],
  }

  const renderModules = (levelId: string) => {
    const levelModules = modules[levelId as keyof typeof modules] || []

    return (
      <div className="space-y-6">
        {levelModules.map((module, index) => (
          <Card key={index} className="border-l-4" style={{ borderLeftColor: getLevelColor(levelId) }}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
                <Badge variant="outline" className="ml-2">
                  Module {index + 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="objectives">
                  <AccordionTrigger className="text-sm font-medium flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Learning Objectives
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-1">
                      {module.objectives.map((objective, i) => (
                        <li key={i} className="text-sm">
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="activities">
                  <AccordionTrigger className="text-sm font-medium flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Activities
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-1">
                      {module.activities.map((activity, i) => (
                        <li key={i} className="text-sm">
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="assessment">
                  <AccordionTrigger className="text-sm font-medium flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Assessment Methods
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm">{module.assessment}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>4-6 hours</span>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  const getLevelColor = (levelId: string) => {
    const level = levels.find((l) => l.id === levelId)
    return level ? level.color.replace("bg-", "#") : "#888888"
  }

  const getLevelName = (levelId: string) => {
    const level = levels.find((l) => l.id === levelId)
    return level ? level.name : ""
  }

  const getLevelIcon = (levelId: string) => {
    const level = levels.find((l) => l.id === levelId)
    return level ? level.icon : ""
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">English Language Learning Program</h1>
          <p className="text-muted-foreground">A comprehensive curriculum from basic literacy to full proficiency</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proficiency Levels</CardTitle>
                <CardDescription>Select a level to view modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {levels.map((level) => (
                    <Button
                      key={level.id}
                      variant={selectedLevel === level.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedLevel(level.id)}
                    >
                      <span className="mr-2">{level.icon}</span>
                      {level.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Level Skills Focus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" /> Grammar
                    </span>
                    <span className="text-sm font-medium">Advanced</span>
                  </div>
                  <Progress value={getSkillLevel(selectedLevel, "grammar")} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <Award className="h-4 w-4 mr-1" /> Vocabulary
                    </span>
                    <span className="text-sm font-medium">Intermediate</span>
                  </div>
                  <Progress value={getSkillLevel(selectedLevel, "vocabulary")} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <Headphones className="h-4 w-4 mr-1" /> Listening
                    </span>
                    <span className="text-sm font-medium">Advanced</span>
                  </div>
                  <Progress value={getSkillLevel(selectedLevel, "listening")} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" /> Speaking
                    </span>
                    <span className="text-sm font-medium">Intermediate</span>
                  </div>
                  <Progress value={getSkillLevel(selectedLevel, "speaking")} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center mb-6">
              <div
                className="mr-4 p-2 rounded-full text-2xl"
                style={{ backgroundColor: getLevelColor(selectedLevel) + "20" }}
              >
                {getLevelIcon(selectedLevel)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{getLevelName(selectedLevel)}</h2>
                <p className="text-muted-foreground">{getLevelDescription(selectedLevel)}</p>
              </div>
            </div>

            <Tabs defaultValue="modules">
              <TabsList className="mb-4">
                <TabsTrigger value="modules">Modules</TabsTrigger>
                <TabsTrigger value="overview">Level Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="modules">{renderModules(selectedLevel)}</TabsContent>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Level {getLevelName(selectedLevel)} Overview</CardTitle>
                    <CardDescription>Key skills and competencies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium flex items-center mb-2">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Grammar Focus
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {getLevelSkills(selectedLevel, "grammar").map((skill, i) => (
                            <li key={i} className="text-sm">
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium flex items-center mb-2">
                          <Award className="h-4 w-4 mr-2" />
                          Vocabulary Focus
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {getLevelSkills(selectedLevel, "vocabulary").map((skill, i) => (
                            <li key={i} className="text-sm">
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium flex items-center mb-2">
                          <Headphones className="h-4 w-4 mr-2" />
                          Listening Focus
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {getLevelSkills(selectedLevel, "listening").map((skill, i) => (
                            <li key={i} className="text-sm">
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium flex items-center mb-2">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Speaking Focus
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {getLevelSkills(selectedLevel, "speaking").map((skill, i) => (
                            <li key={i} className="text-sm">
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Resources</CardTitle>
                    <CardDescription>Materials for {getLevelName(selectedLevel)} level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Textbooks</h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {getResources(selectedLevel, "textbooks").map((resource, i) => (
                            <li key={i} className="text-sm">
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Online Resources</h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {getResources(selectedLevel, "online").map((resource, i) => (
                            <li key={i} className="text-sm">
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Supplementary Materials</h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {getResources(selectedLevel, "supplementary").map((resource, i) => (
                            <li key={i} className="text-sm">
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions for level data
function getLevelDescription(levelId: string): string {
  const descriptions: Record<string, string> = {
    "pre-a1": "Alphabet, basic sounds, and simple introductions",
    a1: "Simple present tense, daily routines, and basic conversations",
    a2: "Past tense, describing places, and ongoing actions",
    b1: "Future forms, life experiences, and making comparisons",
    b2: "Passive voice, conditionals, and reported speech",
    c1: "Advanced conditionals, emphasis structures, and idiomatic language",
    c2: "Complex grammar, specialized vocabulary, and critical analysis",
  }
  return descriptions[levelId] || ""
}

function getSkillLevel(levelId: string, skill: string): number {
  const levels: Record<string, Record<string, number>> = {
    "pre-a1": { grammar: 10, vocabulary: 10, listening: 10, speaking: 10 },
    a1: { grammar: 20, vocabulary: 20, listening: 20, speaking: 20 },
    a2: { grammar: 35, vocabulary: 35, listening: 35, speaking: 35 },
    b1: { grammar: 50, vocabulary: 50, listening: 50, speaking: 50 },
    b2: { grammar: 65, vocabulary: 65, listening: 65, speaking: 65 },
    c1: { grammar: 80, vocabulary: 80, listening: 80, speaking: 80 },
    c2: { grammar: 95, vocabulary: 95, listening: 95, speaking: 95 },
  }
  return levels[levelId]?.[skill] || 0
}

function getLevelSkills(levelId: string, skillType: string): string[] {
  const skills: Record<string, Record<string, string[]>> = {
    "pre-a1": {
      grammar: [
        "English alphabet and phonemes",
        "Basic sentence structure",
        "Pronunciation of key sounds /æ/, /ʌ/, /iː/",
      ],
      vocabulary: [
        "Greetings (hello, hi, good morning)",
        "Numbers 1-20 and basic colors",
        "Family members (mother, father, sister)",
      ],
      listening: [
        "Recognize greetings and numbers in slow audio",
        "Identify colors and simple objects",
        "Follow very basic instructions",
      ],
      speaking: ["Say your name and age", "Ask and answer 'What's your name?'", "Use basic greetings appropriately"],
    },
    a1: {
      grammar: [
        "Verb 'to be' in affirmative, negative and questions",
        "Articles (a, an, the)",
        "Personal and possessive pronouns",
        "Simple Present for daily routines",
      ],
      vocabulary: [
        "Daily activities and routines",
        "Classroom and household objects",
        "Days of the week and months",
        "Time expressions",
      ],
      listening: [
        "Understand simple instructions",
        "Follow basic dialogues about introductions",
        "Recognize time and schedule information",
      ],
      speaking: ["Talk about your daily routine", "Describe your family", "Ask and answer simple personal questions"],
    },
    a2: {
      grammar: [
        "Simple Past with regular and irregular verbs",
        "There is/are and some/any",
        "Present Continuous vs. Simple Present",
        "Prepositions of place and time",
      ],
      vocabulary: [
        "Food and drink items",
        "Transportation and directions",
        "Professions and places in town",
        "Action verbs and activities",
      ],
      listening: [
        "Understand conversations at normal speed",
        "Extract key information (times, prices)",
        "Follow directions and instructions",
      ],
      speaking: [
        "Ask for and give directions",
        "Talk about past events and experiences",
        "Describe what people are doing now",
      ],
    },
    b1: {
      grammar: [
        "Future forms (will vs. going to)",
        "Present Perfect Simple",
        "Comparative and superlative adjectives",
        "Modal verbs (can, should, must)",
      ],
      vocabulary: [
        "Travel and tourism terminology",
        "Health and lifestyle vocabulary",
        "Technology and social media terms",
        "Descriptive adjectives",
      ],
      listening: [
        "Understand short podcasts and news reports",
        "Distinguish between opinions and facts",
        "Follow extended conversations on familiar topics",
      ],
      speaking: [
        "Narrate personal experiences",
        "Express preferences and give advice",
        "Compare options and make recommendations",
      ],
    },
    b2: {
      grammar: [
        "Passive voice and causative forms",
        "Conditional clauses (0, 1, and 2)",
        "Reported Speech",
        "Common phrasal verbs",
      ],
      vocabulary: [
        "Business and basic finance terms",
        "Entertainment and cultural vocabulary",
        "Environmental issues",
        "Idiomatic expressions",
      ],
      listening: [
        "Understand radio news and authentic videos",
        "Infer meaning of idiomatic expressions",
        "Follow complex arguments and discussions",
      ],
      speaking: [
        "Participate in debates on general topics",
        "Give short presentations",
        "Use a range of discourse markers",
        "Express and justify opinions",
      ],
    },
    c1: {
      grammar: [
        "Third conditional and mixed conditionals",
        "Inversions and emphatic structures",
        "Advanced connectors (moreover, nevertheless)",
        "Complex tense relationships",
      ],
      vocabulary: [
        "Idiomatic expressions and collocations",
        "Academic and technical jargon",
        "Nuances of meaning between similar words",
        "Formal and informal registers",
      ],
      listening: [
        "Comprehend lectures and seminars",
        "Identify speaker's tone and intention",
        "Follow complex arguments with implied meaning",
        "Understand a range of accents",
      ],
      speaking: [
        "Construct well-structured arguments",
        "Participate in professional role-plays",
        "Use appropriate register for different contexts",
        "Express abstract ideas fluently",
      ],
    },
    c2: {
      grammar: [
        "Advanced use of all tenses and aspects",
        "Subjunctive and complex hypothetical structures",
        "Sophisticated indirect styles",
        "Subtle grammatical nuances",
      ],
      vocabulary: [
        "Academic and literary lexicon",
        "Rare words and formal registers",
        "Euphemisms and specialized terminology",
        "Subtle connotations and denotations",
      ],
      listening: [
        "Analyze films and academic lectures critically",
        "Evaluate complex discourse and rhetoric",
        "Understand specialized discussions",
        "Follow rapid speech with colloquialisms",
      ],
      speaking: [
        "Deliver extended academic discourse",
        "Perform basic simultaneous translation",
        "Debate at professional level",
        "Express complex ideas with precision",
      ],
    },
  }
  return skills[levelId]?.[skillType] || []
}

function getResources(levelId: string, resourceType: string): string[] {
  const resources: Record<string, Record<string, string[]>> = {
    "pre-a1": {
      textbooks: ["English Alphabet Fun (Student Book + Workbook)", "First Words in English", "Phonics for Beginners"],
      online: [
        "Interactive Alphabet Games (englishforkids.com)",
        "Basic English Sounds App",
        "Greetings and Numbers Videos",
      ],
      supplementary: ["Alphabet Flashcards", "Color and Number Posters", "Family Picture Dictionary"],
    },
    a1: {
      textbooks: [
        "English Basics 1 (Student Book + Workbook)",
        "Everyday English for Beginners",
        "Grammar Foundations 1",
      ],
      online: [
        "Daily Routines Interactive Exercises",
        "Simple Present Practice App",
        "Basic English Conversation Videos",
      ],
      supplementary: ["Verb 'To Be' Flashcards", "Daily Activities Picture Cards", "Simple Present Worksheet Pack"],
    },
    a2: {
      textbooks: ["English in Use A2 (Student Book + Workbook)", "Past Tense Stories", "Describing Places and Actions"],
      online: [
        "Past Tense Interactive Exercises",
        "There is/are Practice App",
        "Present Continuous vs. Simple Present Videos",
      ],
      supplementary: ["Irregular Verb Cards", "Preposition of Place Posters", "City Map Activity Pack"],
    },
    b1: {
      textbooks: [
        "Intermediate English B1 (Student Book + Workbook)",
        "Future Forms and Present Perfect",
        "Comparisons and Modals in Context",
      ],
      online: [
        "Future Forms Interactive Exercises",
        "Present Perfect vs. Simple Past App",
        "Comparative and Superlative Videos",
      ],
      supplementary: ["Modal Verb Cards", "Travel Vocabulary Expansion Pack", "Technology Discussion Cards"],
    },
    b2: {
      textbooks: [
        "Upper Intermediate English B2 (Student Book + Workbook)",
        "Passive Voice and Conditionals",
        "Reported Speech in Context",
      ],
      online: [
        "Passive Voice Transformation Exercises",
        "Conditional Clauses Interactive App",
        "Phrasal Verbs Video Series",
      ],
      supplementary: [
        "Phrasal Verb Dictionary",
        "Business English Vocabulary Cards",
        "Reported Speech Transformation Worksheets",
      ],
    },
    c1: {
      textbooks: [
        "Advanced English C1 (Student Book + Workbook)",
        "Complex Conditionals and Emphasis",
        "Academic English Vocabulary",
      ],
      online: [
        "Advanced Conditional Exercises",
        "Emphasis and Inversion Interactive App",
        "Idiomatic Expressions Video Series",
      ],
      supplementary: ["Advanced Connector Cards", "Idiom and Collocation Dictionary", "Academic Word List Study Pack"],
    },
    c2: {
      textbooks: [
        "Proficiency English C2 (Student Book + Workbook)",
        "Complex Grammar Structures",
        "Literary and Academic Vocabulary",
      ],
      online: [
        "Complex Tense Relationship Exercises",
        "Subjunctive and Hypothetical Structures App",
        "Critical Listening Analysis Videos",
      ],
      supplementary: ["Advanced Academic Word List", "Literary Analysis Toolkit", "Specialized Field Glossaries"],
    },
  }
  return resources[levelId]?.[resourceType] || []
}
