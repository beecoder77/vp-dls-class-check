const checkClass = require('./checkClass');

const data = [
    {"username": "iniUsername", "password": "iniPassword"}
  ];

const checkAllClass = async (data) => {
    for(const datas of data){
        await checkClass(datas['username'], datas['password'], 'Programming by beecoder77');
    }
}

(async () => {
    await checkAllClass(data);
})();