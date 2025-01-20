let token = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'login') {
        const { email, password } = message;

        fetch('http://127.0.0.1:8000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.token) {
                    token = data.token;
                    console.log(token);
                    chrome.storage.local.set({ authToken: token }, () => {
                        sendResponse({ success: true });
                    });
                } else {
                    sendResponse({ success: false });
                }
            })
            .catch((error) => {
                console.error('Login failed:', error);
                sendResponse({ success: false });
            });


        return true;
    }

    if (message.action === 'getToken') {
        getToken().then(token => sendResponse({ token }));
        return true;
    }
    if (message.action === 'postToFacebook') {
        console.log('Background script received postToFacebook request:', message.product);

         
        if (message.action === 'postToFacebook') {
            handlePostToFacebook(message.product);
            return false;  
        }
        return true;
    }
});
async function handlePostToFacebook(product) {
    try { 
        const tab = await chrome.tabs.create({
            url: 'https://www.facebook.com/marketplace/create/item'
        });
 
        await new Promise(resolve => setTimeout(resolve, 5000));
 
        console.log('Sending product data to content script');
        await chrome.tabs.sendMessage(tab.id, {
            action: 'fillMarketplaceForm',
            product: product
        });

    } catch (error) {
        console.error('Error in handlePostToFacebook:', error);
    }
}
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get('authToken', (data) => {
        if (data.authToken) {
            token = data.authToken;
        }
    });
});

function getToken() {
    return new Promise((resolve) => {
        if (token) {
            resolve(token);
        } else {
            chrome.storage.local.get('authToken', (data) => {
                resolve(data.authToken);
            });
        }
    });
}
