async function getMessages() {
    const apiKeyInput = document.getElementById('apiKey').value;
    const emailPassInput = document.getElementById('emailPass').value;
    const otpType = document.getElementById('otpType').value;
    const resultDiv = document.getElementById('result');

    // Kiểm tra input
    if (!apiKeyInput || !emailPassInput) {
        resultDiv.innerHTML = 'Vui lòng nhập đầy đủ thông tin!';
        return;
    }

    // Tách email và password
    const [email, password] = emailPassInput.split(':');
    if (!email || !password) {
        resultDiv.innerHTML = 'Email:Password không đúng định dạng!';
        return;
    }

    // Encode các thành phần URL
    const encodedEmail = encodeURIComponent(email);
    const encodedPassword = encodeURIComponent(password);

    const options = {
        method: 'GET',
        url: `https://api.firstmail.ltd/v1/get/messages?username=${encodedEmail}&password=${encodedPassword}`,
        headers: {
            accept: 'application/json',
            'X-API-KEY': apiKeyInput
        }
    };

    try {
        resultDiv.innerHTML = 'Đang tải...';
        const response = await axios.request(options);
        const messages = response.data;
        let otpResult = '';

        for (const message of messages) {
            const isGradient = message.from.includes('gradient.network');
            const isDawn = message.from.includes('dawninternet.com');

            if ((otpType === 'gradient' && isGradient) || (otpType === 'dawn' && isDawn)) {
                const htmlContent = message.html;

                if (isGradient) {
                    const otpDigits = extractGradientOTP(htmlContent);
                    if (otpDigits) {
                        otpResult += `
                            <div class="otp-container">
                                <div class="otp-title">
                                    <img src="https://images.gradient.network/emails/gradient_logo.png" alt="Gradient">
                                    <span>Gradient Verification Code</span>
                                </div>
                                <div class="otp-digits">
                                    ${otpDigits.map(digit => `
                                        <div class="otp-digit">${digit}</div>
                                        ${digit === otpDigits[2] ? '<div class="otp-separator"></div>' : ''}
                                    `).join('')}
                                </div>
                                <div class="timestamp">
                                    Received: ${new Date(message.date).toLocaleString()}
                                </div>
                            </div>
                        `;
                    }
                } else if (isDawn) {
                    const verifyUrl = extractDawnVerifyUrl(htmlContent);
                    if (verifyUrl) {
                        const verifyKey = extractKeyFromUrl(verifyUrl);
                        otpResult += `
                            <div class="otp-container dawn">
                                <div class="otp-title">
                                    <img src="https://www.aeropres.in/static/dawn-extension.png" alt="Dawn">
                                    <span>Dawn Verification Link</span>
                                </div>
                                <div class="verify-key">
                                    <div class="key-container">${verifyKey}</div>
                                </div>
                                <div class="verify-link">
                                    <a href="${verifyUrl}" target="_blank" class="verify-button">Verify Email</a>
                                </div>
                                <div class="timestamp">
                                    Received: ${new Date(message.date).toLocaleString()}
                                </div>
                            </div>
                        `;
                    }
                }
            }
        }

        if (otpResult) {
            resultDiv.innerHTML = otpResult;
        } else {
            resultDiv.innerHTML = `Không tìm thấy mã OTP ${otpType === 'gradient' ? 'Gradient' : 'Dawn'} trong các email gần đây.`;
        }
    } catch (error) {
        resultDiv.innerHTML = `Lỗi: ${error.message}`;
    }
}

function extractGradientOTP(htmlContent) {
    const pDivRegex = /<div class="pDiv">\s*(\w)\s*<\/div>/g;
    let otpCharacters = [];
    let match;

    while ((match = pDivRegex.exec(htmlContent)) !== null) {
        if (match[1] !== '\n' && match[1] !== ' ') {
            otpCharacters.push(match[1]);
        }
    }

    // Loại bỏ các div trống
    return otpCharacters.filter(char => char.trim() !== '');
}

function extractDawnVerifyUrl(htmlContent) {
    const urlRegex = /https:\/\/verify\.dawninternet\.com\/chromeapi\/dawn\/v1\/userverify\/verifyconfirm\?key=[a-zA-Z0-9-]+/;
    const match = htmlContent.match(urlRegex);
    return match ? match[0] : null;
}

function extractKeyFromUrl(url) {
    const keyRegex = /key=([a-zA-Z0-9-]+)/;
    const match = url.match(keyRegex);
    return match ? match[1] : null;
} 