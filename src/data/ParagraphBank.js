// Paragraph bank organized by difficulty level
export const PARAGRAPHS = {
  easy: [
    "The sun rises in the east and sets in the west. Every morning brings new opportunities and challenges. We must embrace each day with enthusiasm and determination.",

    "Reading books expands our knowledge and imagination. Stories take us to different worlds and times. Literature enriches our understanding of human nature.",

    "Technology continues to evolve at an incredible pace. New innovations emerge almost daily. These advancements shape how we live and work.",

    "Exercise is essential for maintaining good health. Regular physical activity strengthens our bodies and minds. Even simple walks can make a significant difference.",

    "Music has the power to touch our souls. Different melodies evoke various emotions and memories. It connects people across cultures and generations.",

    "Nature provides us with countless wonders to explore. From towering mountains to vast oceans. The natural world inspires awe and respect.",

    "Friendship is one of life's greatest treasures. True friends support us through difficult times. They celebrate our successes and share our joys.",

    "Learning never stops throughout our entire lives. Each experience teaches us something valuable. Curiosity drives us to discover and grow.",

    "Food brings people together in wonderful ways. Sharing meals creates bonds and memories. Different cuisines reflect diverse cultural traditions.",

    "Dreams motivate us to reach for greatness. They give us direction and purpose. Pursuing our aspirations makes life meaningful.",
  ],

  medium: [
    "The internet has revolutionized how we access information. Within seconds, we can find answers to almost any question. However, we must learn to distinguish reliable sources from misinformation. Critical thinking skills are more important than ever before.",

    "Climate change affects every corner of our planet. Rising temperatures alter weather patterns and ecosystems. Scientists urge immediate action to reduce carbon emissions. Individual choices and government policies both play crucial roles. The future depends on decisions we make today.",

    "Artificial intelligence is transforming numerous industries rapidly. Machines can now perform tasks once thought impossible. This technology offers tremendous benefits but also raises ethical questions. We must carefully consider how to develop and use AI responsibly.",

    "Education opens doors to countless opportunities in life. Knowledge empowers individuals to make informed decisions. Schools should foster creativity alongside traditional academic skills. Lifelong learning helps us adapt to changing circumstances. Investment in education benefits entire societies.",

    "Travel broadens our perspectives and understanding of the world. Experiencing different cultures challenges our assumptions and biases. We learn to appreciate diversity and find common ground. Every journey teaches valuable lessons about ourselves and others.",

    "Mental health deserves the same attention as physical health. Stress and anxiety affect millions of people worldwide. Seeking help demonstrates strength rather than weakness. Society must reduce stigma surrounding mental health issues. Support systems and resources should be readily available.",

    "Innovation drives progress in science and technology fields. Creative problem-solving leads to breakthrough discoveries and inventions. Collaboration between disciplines often produces the best results. Failure is an essential part of the innovation process.",

    "Communication skills are vital in personal and professional settings. Clear expression of ideas prevents misunderstandings and conflicts. Active listening shows respect and builds stronger relationships. Technology offers new ways to connect across distances.",

    "Sustainable practices protect our environment for future generations. Reducing waste and conserving resources makes a real difference. Small changes in daily habits can have significant impacts. Businesses and individuals share responsibility for environmental stewardship.",

    "Art reflects and shapes culture throughout human history. Creative expression takes countless forms across different societies. Museums and galleries preserve important cultural heritage. Supporting artists enriches communities and inspires innovation.",
  ],

  hard: [
    "The exploration of space represents humanity's boldest endeavor to understand our place in the universe. Astronauts risk their lives to expand the boundaries of human knowledge and capability. Advanced telescopes reveal distant galaxies and mysterious cosmic phenomena that challenge our understanding. International cooperation in space programs demonstrates what we can achieve when nations work together. The technologies developed for space exploration often find applications in everyday life. Future missions to Mars and beyond will require unprecedented levels of innovation and determination.",

    "Democracy requires active participation from informed and engaged citizens to function effectively. Voting in elections is just one aspect of civic responsibility in a democratic society. Understanding complex policy issues demands time and effort from busy individuals. Media literacy helps people navigate the overwhelming flood of information and misinformation. Protecting democratic institutions requires constant vigilance against threats both foreign and domestic. The health of democracy depends on respectful dialogue across political divides.",

    "Biotechnology and genetic engineering offer revolutionary possibilities for medicine and agriculture worldwide. Scientists can now edit genes with unprecedented precision using advanced molecular tools. These capabilities raise profound ethical questions about the limits of human intervention in nature. Potential benefits include curing genetic diseases and feeding growing populations more efficiently. However, unintended consequences could affect ecosystems and future generations in unpredictable ways. Society must establish thoughtful guidelines for responsible development and application of these technologies.",

    "Global economic systems have become increasingly interconnected through trade and financial networks. Events in one country can rapidly affect markets and economies around the world. This interdependence creates both opportunities for growth and vulnerabilities to widespread disruption. Income inequality within and between nations poses significant challenges to social stability. Sustainable economic development must balance profit with environmental protection and social welfare. The future economy will likely be shaped by automation, renewable energy, and changing demographics.",

    "Ocean ecosystems face unprecedented threats from pollution, overfishing, and climate change impacts. Coral reefs, often called rainforests of the sea, are dying at alarming rates. Plastic waste accumulates in massive gyres that harm marine life throughout food chains. Rising ocean temperatures and acidification disrupt delicate ecological balances built over millennia. Protecting marine environments requires international cooperation and significant changes in human behavior. The health of our oceans directly affects the survival and wellbeing of all life on Earth.",

    "Artificial intelligence systems are becoming increasingly sophisticated and capable of complex decision-making processes. Machine learning algorithms can identify patterns in vast datasets that humans might never notice. These technologies promise to revolutionize healthcare, transportation, education, and countless other fields dramatically. However, concerns about bias, privacy, and job displacement must be addressed thoughtfully and proactively. The development of artificial general intelligence could fundamentally transform human civilization in ways we cannot fully predict. Ensuring that AI benefits all of humanity requires careful planning and ethical frameworks.",

    "Historical events shape our present circumstances in ways both obvious and subtle. Understanding the past helps us avoid repeating mistakes and build on previous successes. Different cultures and societies interpret history through their own unique perspectives and values. Primary sources provide direct evidence but must be analyzed critically for bias and context. The study of history develops critical thinking skills applicable to many areas of life. Preserving historical knowledge and artifacts ensures future generations can learn from our experiences.",

    "Renewable energy sources offer sustainable alternatives to fossil fuels that contribute to climate change. Solar and wind power technologies have become increasingly efficient and cost-effective in recent years. Transitioning to clean energy requires massive infrastructure investments and policy changes at all levels. Energy storage solutions are crucial for managing the intermittent nature of renewable sources. The shift away from fossil fuels will create new industries and jobs while disrupting existing ones. Success in this transition will determine our ability to mitigate the worst effects of climate change.",

    "The human brain remains one of the most complex and mysterious structures in the known universe. Neuroscience has made remarkable progress in mapping brain functions and understanding neural processes recently. Consciousness and self-awareness continue to puzzle scientists and philosophers seeking to explain subjective experience. Brain plasticity allows us to learn and adapt throughout our lives in remarkable ways. Mental health conditions often involve intricate interactions between brain chemistry, genetics, and environmental factors. Future breakthroughs in neuroscience could revolutionize treatment of neurological disorders and enhance human capabilities.",

    "Cultural diversity enriches human civilization through varied perspectives, traditions, and creative expressions worldwide. Globalization brings different cultures into closer contact, creating both opportunities and challenges for understanding. Preserving indigenous languages and traditions becomes increasingly important as dominant cultures spread globally. Cross-cultural communication requires sensitivity, respect, and willingness to learn from others with different backgrounds. The arts, cuisine, music, and literature from diverse cultures contribute to a richer human experience. Embracing diversity while finding common ground represents one of humanity's greatest ongoing challenges.",
  ]
};

export const DIFFICULTY_CONFIG = {
  easy: {
    lines: 3,
    label: 'Easy',
    color: '#4e8c43',
    paragraphsRequired: 3 // Complete 3 easy paragraphs to advance
  },
  medium: {
    lines: '4-5',
    label: 'Medium',
    color: '#f39c12',
    paragraphsRequired: 3 // Complete 3 medium paragraphs to advance
  },
  hard: {
    lines: 6,
    label: 'Hard',
    color: '#e74c3c',
    paragraphsRequired: -1 // Continue until time runs out
  }
};

// Helper function to get random paragraph
export const getRandomParagraph = (difficulty, usedParagraphs = []) => {
  const availableParagraphs = PARAGRAPHS[difficulty].filter(
    p => !usedParagraphs.includes(p)
  );

  // If all paragraphs used, reset and allow reuse
  const pool = availableParagraphs.length > 0 ? availableParagraphs : PARAGRAPHS[difficulty];

  return pool[Math.floor(Math.random() * pool.length)];
};

// Helper function to determine next difficulty
export const getNextDifficulty = (completedCount) => {
  if (completedCount < 3) return 'easy';      // 0-2: Easy
  if (completedCount < 6) return 'medium';    // 3-5: Medium
  return 'hard';                               // 6+: Hard
};
