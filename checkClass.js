const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fetch = require('node-fetch');
const { default: axios } = require('axios');

const checkClass = async (username, password, className) => {
    console.log('--------------------------------------------------');
    console.log(`checking username ${username}...`);
    const chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless');
    chromeOptions.addArguments('--disable-gpu');
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    // chromeOptions.setMobileEmulation({width: 375, height: 812, pixelRatio: 3.0});
    const driver = await new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
    try {
        await driver.get('https://vp-dls.com/');
        const loginToken = await driver.findElement(webdriver.By.xpath('//*[@id="block-login"]/input[1]')).getAttribute('value');
        await driver.findElement(webdriver.By.id('inputName')).sendKeys(username);
        await driver.findElement(webdriver.By.id('inputPassword')).sendKeys(password);
        await driver.findElement(webdriver.By.id('submit')).click();
        try {
            const isLogin = await driver.findElement(webdriver.By.className('loginerrors mt-3')).isDisplayed();
            if (isLogin) {
                console.error(`username ${username} can't login! wrong password or not registered`);
                await driver.quit();
                return {
                    success: false,
                    errorCode: 1,
                    message: `username ${username} can't login! wrong password or not registered`
                };
            }
        } catch (err) {
            // console.log('err: ', err);
        }
        try {
            const isChangePass = await driver.findElement(webdriver.By.id('id_changepassword')).isDisplayed();
            if (isChangePass) {
                console.error(`username ${username} must change password`);
                const passLength = password.length;
                let newPass = password;
                if (passLength < 6) {
                    const diff = 6 - passLength;
                    for (let i = 0; i < diff; i++) {
                        newPass += '1';
                    }
                }
                try {
                    console.log(`try changing password ${password} to ${newPass}...`);
                    await driver.findElement(webdriver.By.id('id_password')).sendKeys(password);
                    await driver.findElement(webdriver.By.id('id_newpassword1')).sendKeys(newPass);
                    await driver.findElement(webdriver.By.id('id_newpassword2')).sendKeys(newPass);
                    await driver.findElement(webdriver.By.id('id_submitbutton')).click();
                    try {
                        const isFailed = await driver.findElement(webdriver.By.className('alert alert-danger alert-block fade in ')).isDisplayed();
                        if (isFailed) {
                            console.error(`failed to change password to ${newPass}! username ${username} must change tpassword manually!`);
                            console.log('--------------------------------------------------');
                            await driver.quit();
                            return {
                                success: false,
                                errorCode: 2,
                                message: `username ${username} must change password manually!`
                            };
                        }
                    } catch (err) {
                        // console.log('err: ', err);
                    }
                    await driver.wait(webdriver.until.elementLocated(webdriver.By.className('continuebutton')), 10000);
                    console.log(`success changed password to ${newPass}`);
                } catch (err) {
                    console.error('failed change password! err: ', err);
                    console.warn(`username ${username} must change password`);
                    await driver.quit();
                    return {
                        success: false,
                        errorCode: 2,
                        message: `username ${username} must change password`
                    };
                }
                await driver.get('https://vp-dls.com/my/');
            }
        } catch (err) {
            // console.log('err: ', err);
        }
        const sessKey = await driver.findElement(webdriver.By.name('sesskey')).getAttribute('value');
        const cookie = (await driver.manage().getCookie('MoodleSession')).value;
        await driver.wait(webdriver.until.elementLocated(webdriver.By.className('card-deck dashboard-card-deck ')), 10000);
        let isClassFound = false;
        const getClass = await axios.post(`https://vp-dls.com/lib/ajax/service.php?sesskey=${sessKey}&info=core_course_get_enrolled_courses_by_timeline_classification`, [{"index":0,"methodname":"core_course_get_enrolled_courses_by_timeline_classification","args":{"offset":0,"limit":0,"classification":"all","sort":"fullname","customfieldname":"","customfieldvalue":""}}], {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json",
                "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Linux\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                "cookie": "MoodleSession="+cookie,
                "Referer": "https://vp-dls.com/my/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
        })

        const classList = [];
        if(getClass.data[0]['data'] && getClass.data[0]['data']['courses']){
            for(const datas of getClass.data[0]['data']['courses']){
                classList.push(datas['fullname']);
                if(datas['fullname'] === className){
                    isClassFound = true;
                }
            }
        }
        
        console.log(`class list: ${classList}`)
        if(isClassFound){
            console.log(`username ${username} have class ${className}`);
            console.log('--------------------------------------------------');
            await driver.quit();
            return {
                success: true,
                message: `username ${username} have class ${className}`
            };
        } else {
            console.warn(`username ${username} doesnt have class ${className}`);
            console.log('--------------------------------------------------');
            await driver.quit();
            return {
                success: true,
                message: `username ${username} doesnt have class ${className}`
            };
        }
    } catch (err) {
        console.log('err: ', err);
        await driver.quit();
        return 0;
    }
}

module.exports = checkClass;