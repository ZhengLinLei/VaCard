var closeShadow, closeDelete, settingPush, DataCards;
const NameLocal_ = btoa('data-card');
//
const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                resolve(base64data);
            };
    });
};
//===============
// Preparation
//===============
if(!localStorage.getItem(NameLocal_)){
    localStorage.setItem(NameLocal_, btoa('[]'));
}

//==============
// Execution
//==============

window.addEventListener('load', ()=>{
    //========
    // PWA installed
    //========
    window.addEventListener('appinstalled', evt => {
        localStorage.setItem('pwa_installed', 1);
    });
    //========
    // Cookies
    //========
    if(!localStorage.getItem('cookies')){
        localStorage.setItem('cookies', 1);

        document.getElementById('cookies').classList.add('open');

        setTimeout(()=>{
            document.getElementById('cookies').classList.remove('open');
        }, 180000)
    }
    settingPush = ()=>{
        document.querySelector('#setting').classList.toggle('open');
    }
    //----
    DataCards = {
        data: JSON.parse(atob(localStorage.getItem(NameLocal_))),
        saveCardDataToSto: () => {
            localStorage.setItem(NameLocal_, btoa(JSON.stringify(DataCards.data)));
        },
        // Create HTML
        htmlCardMaker: (index, json) => {
            const ColorRandom = ['primary', 'secondary', 'danger', 'dark', 'info', 'success', 'warning', 'muted', 'white'];
            const randColor = ColorRandom[Math.floor(Math.random() * ColorRandom.length)];
            return `<div class="column col-12 col-md-6">
                        <a class="btn btn-${randColor} shadow-sm d-flex justify-content-center align-items-center card-info" data-color="${randColor}" id="card-${index}" onclick="DataCards.openCardQr(this)" data-index="${index}">
                            <h4>${json.name}</h4>
                        </a>
                    </div>`;
        },
        updateUI: parentEl => {
            parentEl.innerHTML = '';

            DataCards.data.forEach((el, index) => {
                let html = DataCards.htmlCardMaker(index, el);
    
                parentEl.innerHTML += html;
            });
        },
        openCardQr: el =>{
            let index = el.getAttribute('data-index');
    
            shadow.classList.add('open');
            qrSection.classList.add('open');

            // CHANGE
            qrSection.querySelector('#qrImg').src = DataCards.data[index].qr64;
            qrSection.querySelector('#qrName').innerHTML = DataCards.data[index].name;
            qrSection.querySelector('#qrDate').innerHTML = new Date(DataCards.data[index].date*1000).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit', year: 'numeric'});
            
            qrSection.querySelector('#qrDelete').onclick = () => DataCards.openDeleteUI(index);
        },

        // DELETE
        openDeleteUI: index =>{
            alertDelete.querySelector('#deleteName').innerHTML = DataCards.data[index].name;

            // Change color
            alertDelete.querySelector('#deleteColor').className = `bg-${document.querySelector(`#card-${index}`).getAttribute('data-color')}`;

            alertDelete.querySelector('#confirmDelete').onclick = () => DataCards.deleteCard(index);

            alertDelete.classList.add('open')
        },

        deleteCard: index =>{
            DataCards.data.splice(index, 1);

            // SAVE AND UPDATE
            DataCards.saveCardDataToSto();
            DataCards.updateUI(mainCardList);
            closeShadow();
        },

        // SEARCH AD PUSH
        searchPush: async (formData, triesMax = 3) => {
            let tries = 0;
            while (tries <= triesMax) {
                try {
                    let res = await fetch("http://api.qrserver.com/v1/read-qr-code/", {
                        method: "POST",
                        body: formData
                    });
                    res = await res.json();

                    // Check Errors
                    if(res[0].symbol[0].data){
                        let urlQR = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${res[0].symbol[0].data}`;

                        getBase64FromUrl(urlQR)
                        .then(value => {
                            let vaxCard = {
                                name: nameInput.value,
                                date: parseInt((new Date(vaxDate.value).getTime() / 1000).toFixed(0)),
                                hash: res[0].symbol[0].data,
                                qr64: value
                            }

                            DataCards.data.push(vaxCard);

                            // SAVE AND UPDATE
                            DataCards.saveCardDataToSto();
                            DataCards.updateUI(mainCardList);

                            // RESET AND CLOSE
                            resetForm();
                            closeShadow();

                            document.getElementById('loader').classList.remove('open');
                        });
                    }else{
                        errorShow.innerHTML = res[0].symbol[0].error;
                        document.getElementById('loader').classList.remove('open');
                    }

                    return 0;
                }
                catch(err) {
                    if (tries == triesMax) {
                        if(navigator.onLine){
                            errorShow.innerHTML = 'Try again';
                        }else{
                            errorShow.innerHTML = 'Internet error';
                        }
                        document.getElementById('loader').classList.remove('open');
                    }
                };
                tries++;
            }
        }
    }
    // CLOSE SHADOW
    closeShadow = ()=>{
        [shadow, formAdd, qrSection, alertDelete].forEach(el => el.classList.remove('open'));
    }
    // CLOSE DELETE
    closeDelete = ()=>{
        alertDelete.classList.remove('open');
    }
    //----
    let mainCardList = document.querySelector('#cardList');
    DataCards.updateUI(mainCardList);
    //---
    let shadow = document.querySelector(".shadow"); 
    let formAdd = document.querySelector("#addNew");
    let qrSection = document.querySelector('#QRsection');
    let alertDelete = document.querySelector('#alertDelete');
    //--
    let submitCard = document.querySelector("#submitCard");
    //---
    shadow.addEventListener("click", closeShadow);
    //---
    document.getElementById('add').addEventListener('click', e =>{
        shadow.classList.add('open');
        formAdd.classList.add('open');
    });

    //----
    // ADD CARD
    let nameInput = document.querySelector("#nameInput");
    let vaxDate = document.querySelector('#vaxDate');
    let qrCode = document.querySelector("#qrCode");
    let errorShow = document.querySelector('#errorSubmit');

    function resetForm(){
        nameInput.value = '';
        vaxDate.value = '';
        try{
            qrCode.value = '';
        }catch(e){
            //...
        }
        if(qrCode.value){ //for IE5 ~ IE10
            var form = document.createElement('form'),
                parentNode = qrCode.parentNode, ref = qrCode.nextSibling;
            form.appendChild(qrCode);
            form.reset();
            parentNode.insertBefore(qrCode,ref);
        }
    }

    qrCode.addEventListener('input', ()=>{
        var pathName = qrCode.value.replace(/^.*?([^\\\/]*)$/, '$1');
        document.getElementById('fileName').innerHTML = (pathName.length >= 10) ? pathName.substring(0, 7)+"..." : pathName;
        //Remove error
        errorShow.innerHTML = '';
    })
    submitCard.addEventListener("submit", e =>{
        //prevent 
        e.preventDefault()
        //
        if(nameInput.value && vaxDate.value && qrCode.files){
            const formData = new FormData();
            formData.append('file', qrCode.files[0]);

            document.getElementById('loader').classList.add('open');
            
           // Call
           DataCards.searchPush(formData);
        }
        
    });
    

    //---
    // SHOW QR
});



// function reset(){
//     randMoveButton.onclick = ()=>{
//         randMove();
    
//         randMoveButton.onclick = '';
//     }
// }

// reset();

// //! Cuando le de click tambien ejecuta reset()