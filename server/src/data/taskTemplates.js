export const TASK_STATIONS = [
  {
    id: "inheritance-bay",
    label: "Inheritance Bay",
    // Inside room (x:20,y:15,w:175,h:155), near the bottom — center-x=107, bottom edge=170
    x: 107,
    y: 152,
    room: "Inheritance Bay",
    systemPart: "Base class hull"
  },
  {
    id: "polymorphism-lab",
    label: "Polymorphism Lab",
    // Inside room (x:445,y:15,w:175,h:155), near the bottom — center-x=532
    x: 532,
    y: 152,
    room: "Polymorphism Lab",
    systemPart: "Dispatch engine"
  },
  {
    id: "encapsulation-vault",
    label: "Encapsulation Vault",
    // Inside room (x:235,y:265,w:170,h:145), near the bottom — center-x=320, bottom edge=410
    x: 320,
    y: 385,
    room: "Encapsulation Vault",
    systemPart: "State security core"
  }
];

export const TASK_TEMPLATES = [
  {
    id: "inheritance-core",
    type: "inheritance",
    stationId: "inheritance-bay",
    title: "Repair The Subclass",
    prompt:
      "The inheritance layer is broken. Make the child type inherit correctly, initialize base state, and override the inherited behavior.",
    visibleChecks: [
      "The child type should inherit from the base type",
      "The constructor should initialize the inherited name field",
      "The override should return the child-specific sound"
    ],
    languages: {
      javascript: {
        starterCode: `class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return this.name + " makes a sound";
  }
}

class Dog {
  constructor(name) {
    this.name = name;
  }
}
`,
        corruptedStarterCode: `class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return this.name + " makes a sound";
  }
}

class Dog {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return this.name + bark;
  }
}
`
      },
      python: {
        starterCode: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} makes a sound"

class Dog:
    def __init__(self, name):
        self.name = name
`,
        corruptedStarterCode: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} makes a sound"

class Dog:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return self.name + bark
`
      },
      java: {
        starterCode: `class Animal {
    protected String name;

    Animal(String name) {
        this.name = name;
    }

    String speak() {
        return name + " makes a sound";
    }
}

class Dog {
    Dog(String name) {
    }
}
`,
        corruptedStarterCode: `class Animal {
    protected String name;

    Animal(String name) {
        this.name = name;
    }

    String speak() {
        return name + " makes a sound";
    }
}

class Dog {
    Dog(String name) {
        this.name = name;
    }

    String speak() {
        return name + bark;
    }
}
`
      },
      cpp: {
        starterCode: `#include <string>
using namespace std;

class Animal {
protected:
    string name;
public:
    Animal(string name) : name(name) {}

    virtual string speak() {
        return name + " makes a sound";
    }
};

class Dog {
public:
    Dog(string name) {}
};
`,
        corruptedStarterCode: `#include <string>
using namespace std;

class Animal {
protected:
    string name;
public:
    Animal(string name) : name(name) {}

    virtual string speak() {
        return name + " makes a sound";
    }
};

class Dog {
    string name;
public:
    Dog(string name) : name(name) {}

    string speak() {
        return name + bark;
    }
};
`
      },
      c: {
        starterCode: `#include <string.h>

typedef struct {
    char name[32];
} Animal;

typedef struct {
    Animal base;
} Dog;

void Animal_init(Animal* animal, const char* name) {
    strcpy(animal->name, name);
}

const char* Animal_speak(Animal* animal) {
    return animal->name;
}

void Dog_init(Dog* dog, const char* name) {
    // TODO: initialize the embedded Animal base
}

const char* Dog_speak(Dog* dog) {
    // TODO: return "<name> barks"
    return dog->base.name;
}
`,
        corruptedStarterCode: `#include <string.h>

typedef struct {
    char name[32];
} Animal;

typedef struct {
    char name[32];
} Dog;

void Animal_init(Animal* animal, const char* name) {
    strcpy(animal->name, name);
}

void Dog_init(Dog* dog, const char* name) {
    strcpy(dog->name, name);
}

const char* Dog_speak(Dog* dog) {
    return bark;
}
`
      }
    }
  },
  {
    id: "polymorphism-core",
    type: "polymorphism",
    stationId: "polymorphism-lab",
    title: "Restore Runtime Dispatch",
    prompt:
      "The dispatch engine is down. Implement shape-specific area behavior and a total-area routine that relies on each shape's own implementation.",
    visibleChecks: [
      "Circle should compute area from radius",
      "Rectangle should compute area from width and height",
      "The total function should call the type-specific area behavior"
    ],
    languages: {
      javascript: {
        starterCode: `class Shape {
  area() {
    return 0;
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }

  area() {
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  area() {
  }
}

function totalArea(shapes) {
}
`,
        corruptedStarterCode: `class Shape {
  area() {
    return 0;
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width + this.height;
  }
}

function totalArea(shapes) {
  return shapes.length;
}
`
      },
      python: {
        starterCode: `import math

class Shape:
    def area(self):
        return 0

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        pass

def total_area(shapes):
    pass
`,
        corruptedStarterCode: `import math

class Shape:
    def area(self):
        return 0

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width + self.height

def total_area(shapes):
    return len(shapes)
`
      },
      java: {
        starterCode: `abstract class Shape {
    abstract double area();
}

class Circle extends Shape {
    private double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    @Override
    double area() {
        return 0;
    }
}

class Rectangle extends Shape {
    private double width;
    private double height;

    Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    double area() {
        return 0;
    }
}

class AreaUtil {
    static double totalArea(Shape[] shapes) {
        return 0;
    }
}
`,
        corruptedStarterCode: `abstract class Shape {
    abstract double area();
}

class Circle extends Shape {
    private double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    @Override
    double area() {
        return Math.PI * radius;
    }
}

class Rectangle extends Shape {
    private double width;
    private double height;

    Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    double area() {
        return width + height;
    }
}

class AreaUtil {
    static double totalArea(Shape[] shapes) {
        return shapes.length;
    }
}
`
      },
      cpp: {
        starterCode: `#include <vector>
using namespace std;

class Shape {
public:
    virtual double area() const = 0;
};

class Circle : public Shape {
    double radius;
public:
    Circle(double radius) : radius(radius) {}

    double area() const override {
        return 0;
    }
};

class Rectangle : public Shape {
    double width;
    double height;
public:
    Rectangle(double width, double height) : width(width), height(height) {}

    double area() const override {
        return 0;
    }
};

double totalArea(const vector<Shape*>& shapes) {
    return 0;
}
`,
        corruptedStarterCode: `#include <vector>
using namespace std;

class Shape {
public:
    virtual double area() const = 0;
};

class Circle : public Shape {
    double radius;
public:
    Circle(double radius) : radius(radius) {}

    double area() const override {
        return 3.14159 * radius;
    }
};

class Rectangle : public Shape {
    double width;
    double height;
public:
    Rectangle(double width, double height) : width(width), height(height) {}

    double area() const override {
        return width + height;
    }
};

double totalArea(const vector<Shape*>& shapes) {
    return shapes.size();
}
`
      },
      c: {
        starterCode: `typedef struct Shape Shape;

struct Shape {
    double (*area)(Shape* self);
};

typedef struct {
    Shape base;
    double radius;
} Circle;

typedef struct {
    Shape base;
    double width;
    double height;
} Rectangle;

double circle_area(Shape* self) {
    return 0;
}

double rectangle_area(Shape* self) {
    return 0;
}

double total_area(Shape** shapes, int count) {
    return 0;
}
`,
        corruptedStarterCode: `typedef struct Shape Shape;

struct Shape {
    double (*area)(Shape* self);
};

typedef struct {
    Shape base;
    double radius;
} Circle;

typedef struct {
    Shape base;
    double width;
    double height;
} Rectangle;

double circle_area(Shape* self) {
    return ((Circle*) self)->radius;
}

double rectangle_area(Shape* self) {
    Rectangle* rect = (Rectangle*) self;
    return rect->width + rect->height;
}

double total_area(Shape** shapes, int count) {
    return count;
}
`
      }
    }
  },
  {
    id: "encapsulation-core",
    type: "encapsulation",
    stationId: "encapsulation-vault",
    title: "Lock The State Core",
    prompt:
      "The state core is leaking internal fields. Hide the balance, expose safe operations, and reject invalid withdrawals.",
    visibleChecks: [
      "A deposit should increase the stored balance",
      "An invalid withdrawal should fail and preserve state",
      "The balance should not be exposed as a public field"
    ],
    languages: {
      javascript: {
        starterCode: `class BankAccount {
  constructor(startingBalance = 0) {
    this.balance = startingBalance;
  }

  deposit(amount) {
  }

  withdraw(amount) {
  }

  getBalance() {
  }
}
`,
        corruptedStarterCode: `class BankAccount {
  constructor(startingBalance = 0) {
    this.balance = startingBalance;
  }

  deposit(amount) {
    this.balance = amount;
  }

  withdraw(amount) {
    this.balance -= amount;
    return true;
  }

  getBalance() {
    return this.balance;
  }
}
`
      },
      python: {
        starterCode: `class BankAccount:
    def __init__(self, starting_balance=0):
        self._balance = starting_balance

    def deposit(self, amount):
        pass

    def withdraw(self, amount):
        pass

    def get_balance(self):
        pass
`,
        corruptedStarterCode: `class BankAccount:
    def __init__(self, starting_balance=0):
        self.balance = starting_balance

    def deposit(self, amount):
        self.balance = amount

    def withdraw(self, amount):
        self.balance -= amount
        return True

    def get_balance(self):
        return self.balance
`
      },
      java: {
        starterCode: `class BankAccount {
    private int balance;

    BankAccount(int startingBalance) {
        this.balance = startingBalance;
    }

    void deposit(int amount) {
    }

    boolean withdraw(int amount) {
        return false;
    }

    int getBalance() {
        return 0;
    }
}
`,
        corruptedStarterCode: `class BankAccount {
    public int balance;

    BankAccount(int startingBalance) {
        this.balance = startingBalance;
    }

    void deposit(int amount) {
        this.balance = amount;
    }

    boolean withdraw(int amount) {
        this.balance -= amount;
        return true;
    }

    int getBalance() {
        return balance;
    }
}
`
      },
      cpp: {
        starterCode: `class BankAccount {
private:
    int balance;
public:
    BankAccount(int startingBalance) : balance(startingBalance) {}

    void deposit(int amount) {
    }

    bool withdraw(int amount) {
        return false;
    }

    int getBalance() const {
        return 0;
    }
};
`,
        corruptedStarterCode: `class BankAccount {
public:
    int balance;

    BankAccount(int startingBalance) : balance(startingBalance) {}

    void deposit(int amount) {
        balance = amount;
    }

    bool withdraw(int amount) {
        balance -= amount;
        return true;
    }

    int getBalance() const {
        return balance;
    }
};
`
      },
      c: {
        starterCode: `typedef struct {
    int balance;
} BankAccountInternal;

typedef struct {
    BankAccountInternal internal;
} BankAccount;

void deposit(BankAccount* account, int amount) {
}

int withdraw(BankAccount* account, int amount) {
    return 0;
}

int get_balance(BankAccount* account) {
    return 0;
}
`,
        corruptedStarterCode: `typedef struct {
    int balance;
} BankAccount;

void deposit(BankAccount* account, int amount) {
    account->balance = amount;
}

int withdraw(BankAccount* account, int amount) {
    account->balance -= amount;
    return 1;
}

int get_balance(BankAccount* account) {
    return account->balance;
}
`
      }
    }
  }
];

export function cloneTaskTemplates() {
  return TASK_TEMPLATES.map((task) => ({
    ...task,
    status: "pending",
    completedBy: null,
    corrupted: false
  }));
}
