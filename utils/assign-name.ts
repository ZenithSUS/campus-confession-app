export function assignName () {
    const adjectives = ["Pink", "Blue", "Angry", "Shy", "Fluffy", "Bold"];
    const animals = ["Panda", "Fox", "Tiger", "Bear", "Cat", "Dog"];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

    return `${randomAdjective} ${randomAnimal}`;
}