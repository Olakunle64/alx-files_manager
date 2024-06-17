import { createClient } from 'redis';
import { print } from 'redis';

const client = createClient();
client.on('error', (err) => {
    console.log("Redis client not connected to the server: " + err);
    });
client.on('connect', () => {
        console.log("Redis client connected to the server");
    });

// task 2
function setNewSchool(schoolName, value) {
    client.set(schoolName, value, (err, reply) => {
        if (err) {
            console.log(err);
        }
        print("Reply: " + reply);
    });
}

function displaySchoolValue(schoolName) {
    client.get(schoolName, (err, reply) => {
        if (err) {
            console.log(err);
        }
        print(reply);
    });
}

displaySchoolValue('Holberton');
setNewSchool('HolbertonSanFrancisco', '100');
displaySchoolValue('HolbertonSanFrancisco');