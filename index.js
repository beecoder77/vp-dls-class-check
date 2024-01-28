const checkClass = require('./checkClass');

const memberClassList = [
    {"username": "username", "password": "password"},
  ]  

const payload = {
    data: memberClassList,
    className: 'Pemograman Dasar'
}

const checkAllClass = async (data, className) => {
    for(const datas of data){
        await checkClass(datas['username'], datas['password'], className);
    }
}

(async () => {
    const data = payload.data;
    const className = payload.className;
    await checkAllClass(data, className);
})();