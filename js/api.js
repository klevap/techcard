/**
 * Fetches the list of available examples
 */
export async function fetchExamplesIndex() {
    const response = await fetch('examples/index.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

/**
 * Fetches a specific example by filename
 */
export async function fetchExampleData(fileName) {
    const response = await fetch(`examples/${fileName}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}