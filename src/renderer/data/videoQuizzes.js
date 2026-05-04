export const VIDEO_QUIZ_REWARD_AMOUNT = 0.25;
export const VIDEO_QUIZ_PASSING_SCORE = 2;

const defaultQuiz = {
  title: "Bike learning check",
  questions: [
    {
      prompt: "What should you do before starting a bike repair?",
      choices: [
        "Turn every bolt as fast as you can",
        "Look at the bike and make a simple plan",
        "Skip the tools and guess"
      ],
      correctIndex: 1
    },
    {
      prompt: "Why is it smart to watch each step carefully?",
      choices: [
        "It helps you remember what to try next",
        "It makes the bike heavier",
        "It keeps the chain from existing"
      ],
      correctIndex: 0
    },
    {
      prompt: "If a repair still does not work, what is a good next move?",
      choices: [
        "Give up forever",
        "Hide the bike",
        "Check one part at a time"
      ],
      correctIndex: 2
    }
  ]
};

export const videoQuizzes = {
  UkZxPIZ1ngY: {
    title: "Derailleur and build planning check",
    questions: [
      {
        prompt: "What part helps move the chain from one gear to another?",
        choices: ["Brake lever", "Derailleur", "Seat post"],
        correctIndex: 1
      },
      {
        prompt: "Why should a builder check the parts before starting?",
        choices: [
          "To make sure the parts fit and the right tools are ready",
          "To make the bike disappear",
          "To avoid learning the names of parts"
        ],
        correctIndex: 0
      },
      {
        prompt: "When adjusting gears, what is a careful habit?",
        choices: [
          "Turn every screw all the way",
          "Ignore the chain",
          "Make small changes and test the shifting"
        ],
        correctIndex: 2
      }
    ]
  },
  mAEeAKmCLFU: {
    title: "Brake system check",
    questions: [
      {
        prompt: "What is the main job of bike brakes?",
        choices: ["Make the bike louder", "Help the bike stop safely", "Change the tire color"],
        correctIndex: 1
      },
      {
        prompt: "Why should brake parts be lined up correctly?",
        choices: [
          "So the brakes can work smoothly and safely",
          "So the pedals spin backward",
          "So the bike becomes a scooter"
        ],
        correctIndex: 0
      },
      {
        prompt: "If brakes feel weak, what should you do?",
        choices: ["Ride faster", "Ignore it", "Ask an adult and check the brake system"],
        correctIndex: 2
      }
    ]
  },
  gwBQxhZhKnE: {
    title: "Problem solving repair check",
    questions: [
      {
        prompt: "What is a good way to solve a bike problem?",
        choices: ["Guess many things at once", "Check one possible cause at a time", "Never test the bike"],
        correctIndex: 1
      },
      {
        prompt: "Why do repair videos often show close-up views?",
        choices: [
          "So you can see the part and the step clearly",
          "So the bike looks tiny",
          "So the tools are harder to find"
        ],
        correctIndex: 0
      },
      {
        prompt: "If gears are not shifting well, what might need checking?",
        choices: ["The helmet color", "The water bottle", "The chain and derailleur"],
        correctIndex: 2
      }
    ]
  },
  wQFfPvmYCfY: {
    title: "Chain cleaning check",
    questions: [
      {
        prompt: "Why is it helpful to clean a bike chain?",
        choices: ["It helps the chain move better", "It makes the bike square", "It removes the pedals"],
        correctIndex: 0
      },
      {
        prompt: "What should you do after learning a maintenance step?",
        choices: ["Forget the order", "Practice carefully with an adult nearby", "Throw away the tools"],
        correctIndex: 1
      },
      {
        prompt: "Which part is part of the drivetrain?",
        choices: ["Kickstand sticker", "Bell sound", "Chain"],
        correctIndex: 2
      }
    ]
  },
  XCv0n0sPWJk: {
    title: "Mountain bike build check",
    questions: [
      {
        prompt: "Why do builders test a bike after working on it?",
        choices: ["To check that it works safely", "To make homework longer", "To hide loose parts"],
        correctIndex: 0
      },
      {
        prompt: "What kind of riding can be hard on bike parts?",
        choices: ["Trail riding", "Reading a book", "Drawing a map"],
        correctIndex: 0
      },
      {
        prompt: "What should a good build do?",
        choices: ["Use random parts only", "Match parts to the rider and the trail", "Skip safety checks"],
        correctIndex: 1
      }
    ]
  },
  WJ95ZmqEsss: {
    title: "E-bike troubleshooting check",
    questions: [
      {
        prompt: "What carries power on an e-bike?",
        choices: ["A battery", "A pencil", "A shoelace"],
        correctIndex: 0
      },
      {
        prompt: "If an e-bike does not work, what is a smart first step?",
        choices: ["Paint the tire", "Check simple connections and power", "Remove every part quickly"],
        correctIndex: 1
      },
      {
        prompt: "Why should electrical repairs be careful?",
        choices: ["Wires are pretend", "Electricity is always silly", "Power systems can be unsafe if handled wrong"],
        correctIndex: 2
      }
    ]
  },
  CGGcfw1BU_Q: {
    title: "E-bike motor system check",
    questions: [
      {
        prompt: "What does an e-bike motor help do?",
        choices: ["Add power to help the bike move", "Make the seat invisible", "Turn handlebars into pedals"],
        correctIndex: 0
      },
      {
        prompt: "Why do builders think about hills and weight?",
        choices: ["They change how much work the motor must do", "They erase the map", "They make brakes unnecessary"],
        correctIndex: 0
      },
      {
        prompt: "Which parts work together in an e-bike system?",
        choices: ["Fork and sandwich", "Battery, controller, and motor", "Book, pencil, and desk"],
        correctIndex: 1
      }
    ]
  },
  ZJFN9M_EoRM: {
    title: "Dirt bike suspension check",
    questions: [
      {
        prompt: "What does suspension help with?",
        choices: ["Holding a pencil", "Soaking up bumps while riding", "Changing the weather"],
        correctIndex: 1
      },
      {
        prompt: "Why should rebuild steps stay in order?",
        choices: [
          "So parts go back together correctly",
          "So the bike can talk",
          "So bolts can hide"
        ],
        correctIndex: 0
      },
      {
        prompt: "Who should help with complicated dirt bike repairs?",
        choices: ["No one ever", "A pet", "An adult or trained mechanic"],
        correctIndex: 2
      }
    ]
  },
  db5oAAAUVm0: {
    title: "Suspension tip check",
    questions: [
      {
        prompt: "Why does suspension setup matter?",
        choices: ["It can change how the bike feels on bumps", "It changes the moon", "It removes the wheels"],
        correctIndex: 0
      },
      {
        prompt: "What should a rider do after changing a setting?",
        choices: ["Test it carefully", "Never ride again", "Hide the tool"],
        correctIndex: 0
      },
      {
        prompt: "A careful rider makes changes that are...",
        choices: ["Random", "Small and tested", "Secret and unsafe"],
        correctIndex: 1
      }
    ]
  },
  zIzEm_YDdyA: {
    title: "Electronics testing check",
    questions: [
      {
        prompt: "What tool can help test electrical parts?",
        choices: ["A multimeter", "A spoon", "A basketball"],
        correctIndex: 0
      },
      {
        prompt: "Why do repairers test parts before replacing them?",
        choices: ["To find the real problem", "To make more mess", "To avoid using evidence"],
        correctIndex: 0
      },
      {
        prompt: "What should kids do around electrical repair?",
        choices: ["Touch every wire", "Work only with safe adult help", "Ignore safety"],
        correctIndex: 1
      }
    ]
  },
  JEczJP7UoRU: {
    title: "Electrical safety check",
    questions: [
      {
        prompt: "What can a teardown help people learn?",
        choices: ["How a device is built inside", "How to make tires square", "How to skip safety"],
        correctIndex: 0
      },
      {
        prompt: "Why should chargers and batteries be treated carefully?",
        choices: ["They can involve electricity and heat", "They are made of paper only", "They do not matter"],
        correctIndex: 0
      },
      {
        prompt: "What is a safe learner's choice?",
        choices: ["Copy risky steps alone", "Ask an adult before handling electrical parts", "Put wires in water"],
        correctIndex: 1
      }
    ]
  }
};

export function normalizeVideoId(videoId) {
  return String(videoId || "").replace(/-/g, "_");
}

export function getVideoQuiz(videoId) {
  return videoQuizzes[videoId] || videoQuizzes[normalizeVideoId(videoId)] || defaultQuiz;
}
