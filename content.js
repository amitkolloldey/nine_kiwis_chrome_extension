console.log('Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);

    if (request.action === 'fillMarketplaceForm') {
        // Immediately send response that we received the message
        sendResponse({ status: 'starting' });

        // Then start the async process
        fillMarketplaceForm(request.product)
            .then(() => {
                console.log('Form filling completed');
                // We can't use sendResponse here as the message port is already closed
            })
            .catch(error => {
                console.error('Error filling form:', error);
            });
    }
    return true; // Keep the message channel open for async response
});

async function fillMarketplaceForm(product) {
    console.log('Starting to fill form with product:', product);


    await new Promise(resolve => setTimeout(resolve, 2000));

    try {

        const textInputs = document.querySelectorAll('input[type="text"]');
        console.log('Text inputs found:', textInputs);
        if (textInputs.length < 2) {
            console.error('Not enough input fields found on the page');
            return;
        }

        const titleField = textInputs[0];
        await simulateTyping(titleField, product.name);
        console.log('Title filled:', product.name);

        const priceField = textInputs[1];
        await simulateTyping(priceField, product.price.toString());
        console.log('Price filled:', product.price);


        const categoryDropdown = document.querySelector('label[aria-label="Category"]');
        if (!categoryDropdown) {
            console.error('Category dropdown not found!');
            return;
        }
        categoryDropdown.click();

        try {
            // Wait for the dropdown options to appear
            const firstCategoryOption = await waitForSelector('div[aria-label="Dropdown menu"] div[role="button"]');
            firstCategoryOption.click();
            if (firstCategoryOption) {
                firstCategoryOption.click();
                console.log('First category option selected');
            } else {
                console.error('No options found in the category dropdown!');
            }
        } catch (error) {
            console.error('Error selecting category:', error);
        }


        const conditionDropdown = document.querySelector('label[aria-label="Condition"]');
        if (!conditionDropdown) {
            console.error('condition dropdown not found!');
            return;
        }
        conditionDropdown.click();

        try {
            // Wait for the dropdown options to appear
            const firstConditionOption = await waitForSelector('div[aria-label="Select an option"] div[role="option"]');
            firstConditionOption.click();
            if (firstConditionOption) {
                firstConditionOption.click();
                console.log('First condition option selected');
            } else {
                console.error('No options found in the condition dropdown!');
            }
        } catch (error) {
            console.error('Error selecting condition:', error);
        }

    } catch (error) {
        console.error('Error during form filling:', error);
        throw error;
    }
}


async function waitForSelector(selector, timeout = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Element ${selector} not found after ${timeout}ms`);
}

async function simulateTyping(element, text) {
    element.focus();
    // Clear existing value
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));

    // Type character by character
    for (let char of text) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    element.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
}