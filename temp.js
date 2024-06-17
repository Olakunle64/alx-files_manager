// auto = "Basic kunle:138488:23"
// email_paswd = auto.split(' ')[1]
// console.log(email_paswd)
// email_paswd = email_paswd.split(':')
// email = email_paswd[0]
// password = email_paswd.slice(1).join('')

// console.log(email)
// console.log(password)

function encodeToBase64(str) {
    const buffer = Buffer.from(str, 'utf-8');
    return buffer.toString('base64');
}

// Example usage:
const encodedString = encodeToBase64('Hello, World!');
console.log(encodedString); // Output: SGVsbG8sIFdvcmxkIQ==

function decodeFromBase64(encodedStr) {
    const buffer = Buffer.from(encodedStr, 'base64');
    console.log(buffer)
    console.log(buffer.toString('utf-8'))
    return buffer.toString('utf-8');
}

// Example usage:
const decodedString = decodeFromBase64('SGVsbG8sIFdvcmxkIQ==');
console.log(decodedString); // Output: Hello, World!