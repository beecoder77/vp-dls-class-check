const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fetch = require('node-fetch');

const checkClass = async (username, password, className) => {
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
        const sessKey = await driver.findElement(webdriver.By.name('sesskey')).getAttribute('value');
        const cookie = (await driver.manage().getCookie('MoodleSession')).value;
        let isClassFound = true;
        fetch(`https://vp-dls.com/lib/ajax/service.php?sesskey=${sessKey}&info=core_course_get_enrolled_courses_by_timeline_classification`, {
        "headers": {
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
        },
        "body": "[{\"index\":0,\"methodname\":\"core_course_get_enrolled_courses_by_timeline_classification\",\"args\":{\"offset\":0,\"limit\":0,\"classification\":\"all\",\"sort\":\"fullname\",\"customfieldname\":\"\",\"customfieldvalue\":\"\"}}]",
        "method": "POST"
        }).then(response => response.json()).then(data => {
            for(const datas of data[0]['data']['courses']){
                if(datas['fullname'].includes(className)){
                    isClassFound = true;
                    break;
                }
            }
        });
        
        if(isClassFound){
            console.log(`username ${username} mempunyai class ${className}`);
        } else {
            console.log(`username ${username} tidak mempunyai class ${className}`);
        }
        await driver.quit();
    } catch (err) {
        console.log('err: ', err);
        await driver.quit();
    }
}

module.exports = checkClass;