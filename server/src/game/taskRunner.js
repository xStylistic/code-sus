import vm from "node:vm";
import { normalizeLanguage } from "../data/languages.js";

const TIMEOUT_MS = 700;

export function evaluateTaskCode(task, language, code) {
  const selectedLanguage = normalizeLanguage(language);
  const source = String(code ?? "");

  if (!source.trim()) {
    return {
      passed: false,
      summary: "Write some code before running the task.",
      results: []
    };
  }

  const runner = TASK_RUNNERS[task.id]?.[selectedLanguage];
  if (!runner) {
    return {
      passed: false,
      summary: `No validator exists yet for ${selectedLanguage}.`,
      results: []
    };
  }

  try {
    return runner(source);
  } catch (error) {
    return {
      passed: false,
      summary: error.message,
      results: []
    };
  }
}

const TASK_RUNNERS = {
  "inheritance-core": {
    javascript: (source) => {
      const exports = runInSandbox(source, ["Animal", "Dog"]);
      const visibleResults = [
        runCheck("Dog inherits from Animal", () => {
          const dog = new exports.Dog("Pixel");
          assert(dog instanceof exports.Animal, "Dog must extend Animal.");
        }),
        runCheck("Dog preserves inherited name", () => {
          const dog = new exports.Dog("Pixel");
          assert(dog.name === "Pixel", "The inherited name field should be initialized.");
        }),
        runCheck("Dog overrides speak()", () => {
          const dog = new exports.Dog("Pixel");
          assert(dog.speak() === "Pixel barks", "Expected `Pixel barks`.");
        })
      ];
      return buildResult(visibleResults);
    },
    python: (source) =>
      validateStatic(source, [
        pythonExtends("Dog", "Animal", "Dog should inherit from Animal."),
        contains("super().__init__(name)", "Call super().__init__(name) in Dog."),
        contains('return f"{self.name} barks"', "Dog.speak() should return the bark string.")
      ]),
    java: (source) =>
      validateStatic(source, [
        contains("class Dog extends Animal", "Dog should extend Animal."),
        contains("super(name);", "Dog constructor should call super(name)."),
        contains('return name + " barks";', 'Dog.speak() should return `name + " barks"`.')
      ]),
    cpp: (source) =>
      validateStatic(source, [
        contains("class Dog : public Animal", "Dog should inherit publicly from Animal."),
        contains("Dog(string name) : Animal(name)", "Dog should initialize the Animal base."),
        contains('return name + " barks";', 'Dog::speak() should return `name + " barks"`.')
      ]),
    c: (source) =>
      validateStatic(source, [
        contains("Animal base;", "Dog should embed the Animal base struct."),
        contains("Animal_init(&dog->base, name);", "Dog_init should initialize the embedded Animal base."),
        contains('strcat(buffer, " barks");', 'Dog_speak should append `" barks"` to the name.', false)
      ], {
        fallbackSuccess: /barks/.test(source) && /Animal_init\s*\(\s*&dog->base\s*,\s*name\s*\)/.test(source)
      })
  },
  "polymorphism-core": {
    javascript: (source) => {
      const exports = runInSandbox(source, ["Shape", "Circle", "Rectangle", "totalArea"]);
      const visibleResults = [
        runCheck("Circle computes area correctly", () => {
          const area = new exports.Circle(2).area();
          assert(approx(area, Math.PI * 4), "Circle.area() must return PI * r * r.");
        }),
        runCheck("Rectangle computes area correctly", () => {
          const area = new exports.Rectangle(3, 5).area();
          assert(area === 15, "Rectangle.area() should return width * height.");
        }),
        runCheck("totalArea dispatches to each shape", () => {
          const total = exports.totalArea([new exports.Circle(1), new exports.Rectangle(2, 3)]);
          assert(approx(total, Math.PI + 6), "Expected type-specific area calls inside totalArea.");
        })
      ];
      return buildResult(visibleResults);
    },
    python: (source) =>
      validateStatic(source, [
        contains("return math.pi * self.radius * self.radius", "Circle.area should compute pi * r * r."),
        contains("return self.width * self.height", "Rectangle.area should compute width * height."),
        contains("shape.area()", "total_area should dispatch to each shape's area method.")
      ]),
    java: (source) =>
      validateStatic(source, [
        contains("return Math.PI * radius * radius;", "Circle.area should compute PI * r * r."),
        contains("return width * height;", "Rectangle.area should compute width * height."),
        contains("shape.area()", "totalArea should call each shape's area implementation.")
      ]),
    cpp: (source) =>
      validateStatic(source, [
        contains("return 3.14159 * radius * radius;", "Circle::area should compute radius squared."),
        contains("return width * height;", "Rectangle::area should compute width * height."),
        contains("shape->area()", "totalArea should call each shape's virtual area().")
      ]),
    c: (source) =>
      validateStatic(source, [
        contains("return ((Circle*) self)->radius * ((Circle*) self)->radius", "circle_area should square the radius.", false),
        contains("rect->width * rect->height", "rectangle_area should multiply width and height."),
        contains("shapes[i]->area(shapes[i])", "total_area should dispatch through the function pointer.")
      ], {
        fallbackSuccess:
          /circle_area/.test(source) &&
          /radius\s*\*\s*\(\(Circle\*\)\s*self\)->radius/.test(source) &&
          /shapes\[i\]->area\(shapes\[i\]\)/.test(source)
      })
  },
  "encapsulation-core": {
    javascript: (source) => {
      const exports = runInSandbox(source, ["BankAccount"]);
      const visibleResults = [
        runCheck("Deposit updates balance", () => {
          const account = new exports.BankAccount(10);
          account.deposit(25);
          assert(account.getBalance() === 35, "deposit(25) should produce balance 35.");
        }),
        runCheck("Invalid withdrawals fail", () => {
          const account = new exports.BankAccount(20);
          assert(account.withdraw(30) === false, "withdraw should reject insufficient funds.");
          assert(account.getBalance() === 20, "Failed withdrawals should not change the balance.");
        }),
        runCheck("Public balance field is hidden", () => {
          const account = new exports.BankAccount(5);
          assert(!Object.prototype.hasOwnProperty.call(account, "balance"), "Do not expose a public `balance` field.");
        })
      ];
      return buildResult(visibleResults);
    },
    python: (source) =>
      validateStatic(source, [
        contains("_balance", "Use a non-public _balance field."),
        contains("self._balance += amount", "deposit should increment the hidden balance."),
        contains("return False", "withdraw should return False when invalid.")
      ]),
    java: (source) =>
      validateStatic(source, [
        contains("private int balance;", "Balance should be private."),
        contains("balance += amount;", "deposit should increment balance."),
        contains("return false;", "withdraw should return false for invalid requests.")
      ]),
    cpp: (source) =>
      validateStatic(source, [
        contains("private:", "Balance should live in a private section."),
        contains("balance += amount;", "deposit should increment balance."),
        contains("return false;", "withdraw should return false for invalid requests.")
      ]),
    c: (source) =>
      validateStatic(source, [
        contains("BankAccountInternal internal;", "The public account should wrap an internal state struct."),
        contains("account->internal.balance += amount;", "deposit should update the internal balance."),
        contains("return 0;", "withdraw should return 0 for invalid requests.")
      ])
  }
};

function runInSandbox(source, exportNames) {
  const context = vm.createContext({
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    console: {
      log: () => {}
    }
  });

  const wrappedSource = `
    "use strict";
    ${source}
    globalThis.__taskExports = {
      ${exportNames.map((name) => `${name}: typeof ${name} !== "undefined" ? ${name} : undefined`).join(",\n      ")}
    };
  `;

  const script = new vm.Script(wrappedSource);
  script.runInContext(context, { timeout: TIMEOUT_MS });

  const exported = context.__taskExports ?? {};
  for (const name of exportNames) {
    if (typeof exported[name] === "undefined") {
      throw new Error(`Your code must define \`${name}\`.`);
    }
  }

  return exported;
}

function validateStatic(source, checks, options = {}) {
  const results = checks.map((check) => runCheck(check.name, () => check.test(source)));
  const passed = results.every((result) => result.passed) || Boolean(options.fallbackSuccess);
  return {
    passed,
    summary: passed ? "All checks passed." : "Some checks are still failing.",
    results
  };
}

function contains(fragment, message, normalizeWhitespaceFlag = true) {
  return {
    name: message,
    test(source) {
      const haystack = normalizeWhitespaceFlag ? normalizeWhitespace(source) : source;
      const needle = normalizeWhitespaceFlag ? normalizeWhitespace(fragment) : fragment;
      assert(haystack.includes(needle), message);
    }
  };
}

function pythonExtends(childName, baseName, message) {
  return {
    name: message,
    test(source) {
      assert(new RegExp(`class\\s+${childName}\\s*\\(\\s*${baseName}\\s*\\)\\s*:`).test(source), message);
    }
  };
}

function runCheck(name, check) {
  try {
    check();
    return { name, passed: true, message: "Passed" };
  } catch (error) {
    return { name, passed: false, message: error.message };
  }
}

function buildResult(results) {
  const passed = results.every((result) => result.passed);
  return {
    passed,
    summary: passed ? "All checks passed." : "Some checks are still failing.",
    results
  };
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function approx(actual, expected) {
  return Math.abs(actual - expected) < 0.0001;
}
