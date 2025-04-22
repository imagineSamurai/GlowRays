// Sample JavaScript file for testing the glow effect

/**
 * A simple function to demonstrate the glow effect
 * @param {string} name The name to greet
 * @returns {string} The greeting
 */
function greet(name) {
    console.log("Hello, " + name + "!");
    return "Greeting completed";
}

// Variables with different types
const number = 42;
let string = "Hello world";
var boolean = true;

// Different language constructs
if (boolean) {
    console.log("Boolean is true");
} else {
    console.log("Boolean is false");
}

for (let i = 0; i < 5; i++) {
    console.log(`Iteration ${i}`);
}

// An object with methods
const person = {
    firstName: "John",
    lastName: "Doe",
    fullName: function() {
        return this.firstName + " " + this.lastName;
    }
};

// Call the greet function
greet(person.fullName()); 