var currentShopId='';
var currentShopName='';
var totalCost = 0;
var totalWeight = 0;
var totalBuying = 0;
var clientToken ='';
var itemListArray =[];
var processing = false;
var loggedIn = false;
var phoneNo = window.localStorage.getItem("phoneNo");
var shopLogged = window.localStorage.getItem("shop-id");
var shopLoggedName = window.localStorage.getItem("shop-name");
var todateSales = 0;
var todateProfit = 0;
var customObj;
var userLogged = '';
var shopDescription = '';
var positionLogged=window.localStorage.getItem("positionLogged");
var loggedUserId = window.localStorage.getItem("loggedUserId");
var currencyCode=window.localStorage.getItem("currencyCode");
var currentTill = '';
var userDetails;
var companyId;
var viewedItems;
var itemsOnCart = [];
var remotePurchase = 'false';
var accountBal = 0;
var accountActive = true;
var trial;
var tempCode;
var smartDriver;
var openStatus;
var serverUrl="https://www.smartstore.techapis.xyz/";
var loggedInUser = window.localStorage.getItem("loggedInUser");
var password = window.localStorage.getItem("password");
var currentLatitude = null;
var currentLongitude = null;
var radius = window.localStorage.getItem("radius");
var serviceFee = 0;
var extraCharges = 0;
var paymentGatewayObj = [];
var paypalObj = [];
var distanceFromStore = 0;
var deliveryFee = 0;
var userIsDriver = window.localStorage.getItem("userIsDriver");
var myCurrencyCode = window.localStorage.getItem("currency_code");
var packageSubscribed="TRIAL";
if(radius==null){
    radius=30;
}else{
    radius = parseFloat(radius);
}
var myApp = new Framework7({
    modalTitle: '',
    material: true,
    pushState: true,
});
var $$ = Dom7;
var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true,
    domCache: true
});
myApp.onPageInit('welcome-page', function (page) {
    setTimeout(function(){
       if(shopLogged!=null){
           mainView.router.load({pageName: 'shop-main-page'});
           userLogged = 'shop'
           currentShopId=shopLogged;
       }else{
            userLogged = 'customer'
       }
       getActivationDate();
       $$(".shop-account-ul-btn").hide();
    },1000);
});
myApp.onPageReinit('welcome-page', function (page) {
    setTimeout(function(){
       if(shopLogged!=null){
           mainView.router.load({pageName: 'shop-main-page'});
           userLogged = 'shop';
           currentShopId=shopLogged;
       }else{
            userLogged = 'customer'
       }
       getActivationDate();
       $$(".shop-account-ul-btn").hide();
    },1000);
});

document.addEventListener("deviceready", deviceReady, false);

function deviceReady(){
    var socket = io("https://www.smartstore.techapis.xyz");
    function returnSocket(){
        return socket;
    }
    deviceReady.returnSocket=returnSocket;
    StatusBar.backgroundColorByHexString('#e9eaed');
    if(shopLogged!=null){
        $$(".shopNameShow").text(shopLoggedName.toUpperCase())
        userLogged = 'shop';
        currentShopId=shopLogged;
        if(positionLogged=="WAITER/WAITRESS/DELIVERER"){
            mainView.router.load({pageName: 'deliverer-main-page'});
            getOrdersToDeliver();
        }else{
            mainView.router.load({pageName: 'shop-main-page'});
        }
    }else{
        userLogged = 'customer'
    }
    getActivationDate();
    backBtn();
    socket.on('CashierID-Verify', function(tillNo,theNewCost,phone,amount,shopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,sock){
        if(currentShopId==shopId){
            if(currentTill==tillNo){
                navigator.notification.confirm('Click on Accept if you have the amount mentioned above or else Reject the transaction!',function(buttonIndex){
                    if(buttonIndex==1){
                        socket.emit('cash-payment-accepted', tillNo,theNewCost,phone,amount,currentShopId,itemListString,buyerNumber,initAmount,purchaseDay,totalWeight,sock);
                    }
                },'PLEASE GET PAYMENT OF R '+theNewCost,['Accept','Reject']);
            }
        }
    });
    socket.on('verifyCashPayment', function(tillNo,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod){
        if(currentShopId==shopId){
            if(currentTill==tillNo){
                navigator.notification.confirm('Click on Accept if you have the amount mentioned above or else Reject the transaction!',function(buttonIndex){
                    if(buttonIndex==1){
                        socket.emit('cash-payment-accepted', tillNo,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,function(cb){
                            stopProcess();
                            if(cb){
                                showToast("The transaction was success");
                            }else{
                                showToast("Something went wrong while trying to accept the transaction");
                            }
                        });
                        processStatus(10000);
                    }
                },'PLEASE GET PAYMENT OF '+currencyCode+' '+amount,['Accept','Reject']);
            }
        }
    });
    socket.on('cash-payment-accepted', function(paymentGateway,amount,tokenId,secretKey,shopId,itemListString,buyerNumber,totalBuying,purchaseDay,totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod){
        if(buyerNumber==loggedInUser){
            stopProcess();
            processPayment('',amount,'','',location,latitude,longitude,option,'CA');
            processStatus(10000);
        }
    });
    socket.on('get-payment-history', function(orderNumber,shopId,shopName,itemListString,totalPrice,weight){
        if($("[orderNumber='"+orderNumber+"']").length==0){
            $$(".list-shopid-ul").prepend("<li shopId='"+shopId+"' orderNumber='"+orderNumber+"' itemListString='"+itemListString+"' totalPrice='"+totalPrice+"' weight='"+weight+"'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>store</i></div><div class='item-inner'><div class='item-title'>"+shopName+"</div><div class='item-after'>#"+orderNumber+"</div></div></div></li>");
        }
    });

    socket.on('get-most-purchased', function(itemId,itemQuantity,itemName,itemSelling,itemBuying){
        var totalSales = parseFloat(itemSelling) * parseFloat(itemQuantity);
        var totalInit = parseFloat(itemBuying) * parseFloat(itemQuantity);
        var totalProfit = (totalSales - totalInit).toFixed(2);
        if($("[most-purchased='"+itemId+"']").length==0){
            $$(".most-purchased-ul").append("<div class='card most-purchased-li' most-purchased='"+itemId+"'><div class='card-header item-title'>"+itemName+"</div><div class='card-content'><div class='card-content-inner'><div class='list-block'><ul><li><div class='item-content'><div class='item-inner'><div class='item-title'>ITEMS SOLD</div><div class='item-after'>"+ itemQuantity +"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>TODATE SALES</div><div class='item-after'>"+currencyCode+" "+ totalSales.toFixed(2) +"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>TODATE PROFIT</div><div class='item-after'>"+currencyCode+" "+ totalProfit +"</div></div></div></li></ul></div></div></div></div>")
        }
        stopProcess();
    });
    socket.on('item-found', function(shopId,shopName,shopAddress,itemName,itemSelling,itemQuantity,latitude,longitude){
        stopProcess();
        if($$("[item-found='"+shopId+"']").length==0){
            $$(".item-search-found").append("<div class='card' item-found='"+shopId+"' style='border-radius:20px;box-shadow:none;'><div class='card-header color-teal' style='font-weight:bold;'>"+itemName.toUpperCase()+"</div><div class='card-content-inner list-block'><ul><li><div class='item-content'><div class='item-inner'><div class='item-title'>SHOP NAME</div><div class='item-after'>"+shopName.toUpperCase()+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>COST</div><div class='item-after' style='color:tomato;'>"+parseFloat(itemSelling).toFixed(2)+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>ITEMS LEFT</div><div class='item-after'>"+itemQuantity+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>ADDRESS</div><div class='item-after'>"+shopAddress+"</div></div></div></li></ul></div><div class='card-footer'><a href='#' class='link go-to-shop-panel-btn' shopId='"+shopId+"'><i class='material-icons color-purple'>shopping_basket</i></a><a href='#' class='link getLocationBtn' latitude='"+latitude+"' longitude='"+longitude+"' shopName='"+shopName+"'><i class='material-icons color-teal'>location_on</i></a></div></div>");
        }
    });
    socket.on('no-results-found', function(data){
        stopProcess();
        $$(".item-search-found").html("<center><h3>"+data+"</h3></center>")
    });
    updateLocation(1000);
    socket.on("orderIsReady", function(result){
        var placedBy = result[0].placedBy;
        if (loggedInUser==placedBy) {
            dialogBeep(1);
            navigator.notification.alert("ORDER "+result[0].id+" IS READ",function(){},'ORDER READY','ok');
        }
    });
    socket.on("newOrder", function(id,orderObj,total,status,location,latitude,longitude,shopId,paidFor){
        if (currentShopId==shopId) {
            displayOrders(id,orderObj,total,status,location,'new',latitude,longitude,paidFor);
            dialogBeep(1);
        }
    });
    socket.on("driverMarkJobAsDone",function(id,buyerNumber,delivery_fee,deliverer){
        if(buyerNumber==phoneNo){
            navigator.notification.confirm('Have you received your delivery?',function(buttonIndex){
                if(buttonIndex==1){
                    confirmDelivery(id,delivery_fee,deliverer);
                }
            },'CONFIRM DELIVERY',['Confirm','Cancel']);
        }
    });
    socket.on("buyerConfirmDelivery", function(id,delivery_fee,deliverer){
        if(deliverer==phoneNo){
            stopProcess();
            navigator.notification.alert("Order "+id+" has been marked as delivered. Collect "+myCurrencyCode+" "+parseFloat(delivery_fee).toFixed(2)+" from the buyer",function(){},'ORDER DELIVERED','ok');
        }
    });
    window.plugins.sim.getSimInfo(simSuccessCallback, null);
}
function simSuccessCallback(result){
    $('.select-country-code-input option,.select-country-cus-code-input option').removeAttr('selected').filter('[data-countryCode='+result.countryCode.toUpperCase()+']').attr('selected', true);
}
$$(document).on("click",".getLocationBtn", function(e){
    var latitude = $$(this).attr("latitude");
    var longitude = $$(this).attr("longitude");
    var label = $$(this).attr("shopName");
    getDirection(latitude,longitude,label);
})
function processStatus(time){
    SpinnerPlugin.activityStart('processing please wait...', { dimBackground: true });
    processing=true;
    setTimeout(function(){
         if(processing==true){
            SpinnerPlugin.activityStop();
            showToast('There was an error, Or check your internet connection');
            processing=false;
         }
    },time);
}
function stopProcess(){
    processing=false;
    SpinnerPlugin.activityStop();
}
function exp_date_check(exp_date){
    if(exp_date.length==5){
        if(exp_date[2]=='/'){
            return exp_date;
        }else{
            return 'Please provide a valid exp date like (10/20)';
        }
    }else{
        return 'Please provide a valid exp date like (10/20)';
    }
}
function showToast(message) {
  window.plugins.toast.showWithOptions(
    {
      message: message,
      duration: "long", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
      position: "bottom",
      addPixelsY: -100  // added a negative value to move it up a bit (default 0)
    }
  );
}
function removeItemObj(data,id){
    for(var i = 0; i < data.length; i++) {
        if(data[i].id == id) {
            data.splice(i, 1);
            break;
        }
    }
}
function removeItemDay(data,id){
    for(var i = 0; i < data.length; i++) {
        if(data[i].day == id) {
            data.splice(i, 1);
            break;
        }
    }
}
function getShortTime(){
    var time = new Date();
    var year = (time.getFullYear()).toString();
    var month = time.getMonth()+1;
    var date = time.getDate();
    var hour = time.getHours();
    var minutes = time.getMinutes();
    if (minutes<10) {
        minutes="0"+minutes;
    }else{
        minutes=minutes;
    }
    if (date<10) {
        date="0"+date;
    }else{
        date=date;
    }
    if (hour<10) {
        hour="0"+hour;
    }else{
        hour=hour;
    }
    if(month < 10){
        month="0"+month;
    }else{
        month=month;
    }
    //year.slice(-2) + month + date + '.'+hour+minutes
    return year.substring(2, 4)+month+date+'.'+hour+minutes;
}
function getTime(){
    var time = new Date();
    var year = time.getFullYear();
    var month = time.getMonth()+1;
    var date = time.getDate();
    var hour = time.getHours();
    var minutes = time.getMinutes();
    if (month==1) {
        month="Jan"
    }else if (month==2) {
        month="Feb"
    }else if (month==3) {
        month="Mar"
    }else if (month==4) {
        month="Apr"
    }else if (month==5) {
        month="May"
    }else if (month==6) {
        month="Jun"
    }else if (month==7) {
        month="Jul"
    }else if (month==8) {
        month="Aug"
    }else if (month==9) {
        month="Sep"
    }else if (month==10) {
        month="Oct"
    }else if (month==11) {
        month="Nov"
    }else if (month==12) {
        month="Dec"
    }
    if (minutes<10) {
        minutes="0"+minutes;
    }else{
        minutes=minutes;
    }
    if (date<10) {
        date="0"+date;
    }else{
        date=date;
    }
    if (hour<10) {
        hour="0"+hour;
    }else{
        hour=hour;
    }
    var currentDay = time.getDay();
    return ""+date+" "+month+" "+year+" "+hour+":"+minutes+"";
}
$$(document).on("click",".log-out-btn", function(e){
    navigator.notification.confirm('You will be required to enter your store credentials and your user ID to gain access on your next login',function(buttonIndex){
        if(buttonIndex==1){
            window.localStorage.removeItem("shop-id");
            window.localStorage.removeItem("positionLogged");
            window.localStorage.removeItem("currencyCode");
            shopLogged = null;positionLogged=null;
            window.location='index.html';
        }
    },'CONFIRM LOG OUT',['Logout','Cancel']);
})
var clicked=0;
$$(document).on("click",".main-back-btn", function(e){
   backBtnFn();
});
$$(document).on("click",".custom-btn,.button,a", function(e){
   nativeclick.trigger();
});
function backBtn(){
    document.addEventListener("backbutton", function(e){
       backBtnFn();
    }, false);
}
function backBtnFn(){
    if((mainView.activePage.name=='main-page')||(mainView.activePage.name=='shop-main-page')||(mainView.activePage.name=='welcome-page')){
        clicked++;
        if(clicked==2){
            navigator.app.exitApp();
        }
        setTimeout(function(){
            clicked=0;
            showToast('Double click to exit the app')
        },500);
    }else{
        navigator.app.backHistory();
    }
}
$$(document).on("click",".looking-for-page-btn", function(e){
    if(phoneNo!=null){
        mainView.router.load({pageName: 'looking-for-page'});
    }else{
        changeNumber();
    }
});
$$(document).on("change",".option-goBack", function(e){
    navigator.app.backHistory();
});
$$(document).on("click",".account-edit-btn", function(e){
    var socket = deviceReady.returnSocket();
    mainView.router.load({pageName: 'edit-shop-page'});
    if(positionLogged=='ADMIN'){
        socket.emit('customerLogin',currentShopId,function(result){
            checkActiveStatus(result[0].activationDate,result[0].months,result[0].package);
            if(result[0].package=='TRIAL'){
                $$(".update-package-select").text(result[0].package.toUpperCase() +" PACKAGE ("+result[0].months+" days)");
            }else{
                $$(".update-package-select").text(result[0].package.toUpperCase() +" PACKAGE ("+result[0].months+" months)");
            }
            $$(".operational-radius-input").val(result[0].operationalRadius);
            $$(".shop-description-input-edit").val(result[0].shopDes.toUpperCase());
            $$(".shop-name-input-edit").val(result[0].shopName.toUpperCase());
            $$(".shop-address-input-edit").val(result[0].shopAddress.toUpperCase());
            $$(".shop-password-input-edit").val(result[0].password);
            $$(".shop-verify-input-edit").val(result[0].password);

            if(result[0].remoteOrdering=='TRUE'){
                $$("[title='online-store-checkbox']").attr('checked','checked');
            }else{
                $$("[title='online-store-checkbox']").removeAttr('checked');
            }
            if(result[0].pawnBuy=='TRUE'){
                $$("[title='pawn-buy-checkbox']").attr('checked','checked');
            }else{
                $$("[title='pawn-buy-checkbox']").removeAttr('checked');
            }
            if(result[0].smartDriver=='TRUE'){
                $$("[title='own-drivers-checkbox']").attr('checked','checked');
            }else{
                $$("[title='own-drivers-checkbox']").removeAttr('checked');
            }
        });
    }else{
        navigator.notification.alert('This is classified. You are not authorised',function(){},'PERMISSION DENIED','ok');
    }
});
$$(document).on("click",".enter-shop-id-btn",  function(e) {
    if(phoneNo!=null){
        navigator.notification.prompt('You will be able to buy goods from this shop id',function(results){
            var shopId=results.input1;
            if(results.buttonIndex==1){
                if(shopId!=''){
                    selfLogin(shopId,'normal');
                }else{
                    showToast('Please enter shop ID!')
                }
            }else if(results.buttonIndex==2){
                $(".nearby-stores-btn").click();
            }
        },'ENTER SHOP ID',['PROCEED','FIND IT']);
    }else{
        changeNumber();
    }
});
function changeNumber(){
    mainView.router.load({pageName: 'update-number-page'});
}
$$(document).on("click",".update-phoneNo-btn",  function(e) {
    var phone = $$(".customer-phone-input").val();
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('By Clicking I Agree button, you are confirming that you will abide by our terms and condition. Click READ button for more else cancel',function(buttonIndex){
        if(buttonIndex==1){
            navigator.notification.confirm('Your number will be changed to '+phone+'?',function(buttonIndex){
                if(buttonIndex==1){
                    var code = Math.floor(Math.random()*89999+10000);
                    socket.emit('sendConSms',phone,code,function(cb){
                        if(cb==false){
                            showToast("There was an error while trying to send you an sms!");
                        }
                    });
                    mainView.router.load({pageName: 'confirmation-code-page'});
                    $$(".confirm-code-btn").attr('phone',phone).attr('code',code);
                }
            },'CONFIRM PHONE NUMBER',['Confirm','Cancel']);
        }else if(buttonIndex==2){
            $$(".tnc-btn").click();
        }
    },'TERMS & CONDITION',['I AGREE','READ','CANCEL']);
});
$$(document).on("click",".change-number-btn",  function(e) {
    changeNumber();
});
$$(document).on("click",".confirm-code-btn",  function(e) {
    var confirmationCode = $$(".confirmation-code-input").val();
    var phone = $$(this).attr("phone");
    var code = $$(this).attr("code");
    var socket = deviceReady.returnSocket();
    var countryCode = '+'+ $$(".select-country-cus-code-input").val();
    if(confirmationCode.length>4){
        if(parseInt(confirmationCode) == parseInt(code)){
            socket.emit('updatePhone',phone,countryCode,function(cb,currency_code){
                stopProcess();
                if(cb==true){
                    phoneNo=phone;
                    myCurrencyCode = currency_code;
                    window.localStorage.setItem("phoneNo",phone);
                    window.localStorage.setItem("currency_code",currency_code);
                    showToast('Your phone number has been saved!');
                    $$(".customer-phone-input").val("");
                    navigator.app.backHistory(2);
                }else{
                    showToast('Oops, there was an error while trying to save your phone number!')
                }
            });
            processStatus(10000);
        }else{
            showToast("You have provided an invalid confirmation code!");
        }
    }else{
        showToast("There is an error with your code!");
    }
});
$$(document).on("click",".payment-history-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    mainView.router.load({pageName: 'payment-history-page'});
    socket.emit('get-payment-history',phoneNo,userLogged,currentShopId);
    /*socket.emit('get-payment-history',phoneNo,userLogged,currentShopId,function(result){
        if(result.length>0){
            for (var i = 0; i < result.length; i++){
                var shopName=result[i].shopName;
                var orderNumber=result[i].orderNumber;
                var shopId=result[i].shopId;
                var itemListString=result[i].itemListString;
                var amount=result[i].amount;
                var weight=result[i].totalWeight;
                if($("[orderNumber='"+orderNumber+"']").length==0){
                    $$(".list-shopid-ul").prepend("<li orderNumber='"+orderNumber+"' itemListString='"+itemListString+"' totalPrice='"+amount+"' weight='"+weight+"'><div class='item-content'><div class='item-inner'><div class='item-title'>"+shopName+"</div><div class='item-after'>#"+orderNumber+"</div></div></div></li>");
                }
            }
        }
    });*/
});
$$(document).on("click",".go-to-cart-btn",  function(e) {
    if(loggedIn == true){
        mainView.router.load({pageName: 'item-list-page'});
    }
});
$$(document).on("click",".list-shopid-ul li",  function(e) {
    var socket = deviceReady.returnSocket();
    var itemListString = $$(this).attr("itemListString");
    var orderNumber = $$(this).attr("orderNumber");
    var totalPrice = $$(this).attr("totalPrice");
    var weight = $$(this).attr("weight");
    var shopId = $$(this).attr("shopId");
    mainView.router.load({pageName: 'order-details-page'});
    $$(".order-number-div").text("RECEIPT #"+orderNumber);
    $$(".customer-sales-show-div").show();
    $$(".shop-sales-show-div").hide();
    $$(".order-total-price").html(parseFloat(totalPrice).toFixed(2));
    var itemListStringToArray=JSON.parse(itemListString);
    $("[item-list-receipt='same-same']").remove();
    var totalWeightKg = (parseFloat(weight) / 1000).toFixed(3);
    $$(".show-order-total-weight-sec").html(totalWeightKg+" KG");
    for (var i = 0; i < itemListStringToArray.length; i++){
        (function(x){
            setTimeout(function () {
                var price=itemListStringToArray[x].price;
                var itemName=itemListStringToArray[x].itemName;
                var quantity=itemListStringToArray[x].quantity;
                var itemId = itemListStringToArray[x].id;
                socket.emit('getItemOfSameMass', shopId,itemId,function(boolean){
                    if(boolean==true){
                        $$(".order-item-ul").prepend("<li item-list-receipt='same-same'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>shopping_basket</i></div><div class='item-inner'><div class='item-title' style='color: tomato;'>"+itemName+"</div><div class='item-after' style='color: tomato;'>"+quantity+"*"+parseFloat(price).toFixed(2)+"</div></div></div></li>");
                    }else{
                        $$(".order-item-ul").prepend("<li item-list-receipt='same-same' ><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>shopping_basket</i></div><div class='item-inner'><div class='item-title'>"+itemName+"</div><div class='item-after'>"+quantity+"*"+parseFloat(price).toFixed(2)+"</div></div></div></li>");
                    }
                });
            }, 500 * i);
        })(i);
    }
});
$$(document).on("click",".update-quantity",  function(e) {
    var socket = deviceReady.returnSocket();
    var id = this.id;
    var price = $$(this).attr("price");
    var lastTotalCost = $$(this).attr("last-total");
    var itemName = $$(this).attr("itemName");
    var itemBuying = $$(this).attr("itemBuying");
    var itemWeight = $$(this).attr("itemWeight");
    var itemIcon = $$(this).attr("itemIcon");
    var elem = $$(this);
    navigator.notification.prompt('How many of this item do you want?',function(results){
        var quantity=results.input1;
        if(results.buttonIndex==1){
            if(quantity!=''){
                var filter = /^[0-9-+]+$/;
                if (filter.test(quantity)){
                     totalCost = totalCost -  parseFloat(lastTotalCost);
                     totalBuying = totalBuying - parseFloat(itemBuying);
                     totalWeight = totalWeight - parseFloat(itemWeight);

                     var cost = quantity * parseFloat(price);
                     var totalBuyingCost = quantity * parseFloat(itemBuying);
                     var thisTotalWeight = quantity * parseFloat(itemWeight);

                     totalCost = totalCost + cost;
                     totalBuying = totalBuying + totalBuyingCost;
                     totalWeight = totalWeight + thisTotalWeight;

                     elem.attr("last-total", cost).attr("itemBuying",totalBuyingCost).attr("itemWeight",thisTotalWeight);

                     $("[title"+id+"]").attr("title"+id+"",cost).attr("itemBuying",totalBuyingCost).attr("itemWeight",thisTotalWeight);
                     $$(".total-cost-div").text(currencyCode+" "+ totalCost.toFixed(2));
                     $$("#quantity-div"+id).html(quantity +' * '+currencyCode+' '+price+' = '+currencyCode+' '+cost);
                     removeItemObj(itemListArray,id);
                     itemListArray.push({id:id, price:price, totalPrice:cost, quantity:quantity, itemName:itemName, itemIcon:encodeURIComponent(itemIcon)})
                }else{
                    showToast('Enter number please!')
                }
            }
        }
    },'ENTER QUANTITY',['UPDATE','CANCEL']);
});
$$(document).on("click",".remove-item",  function(e) {
    if(totalCost>0){
        var socket = deviceReady.returnSocket();
        var id = this.id;
        var lastTotalCost = $$(this).attr("title"+id+"");
        var itemBuying = $$(this).attr("itemBuying");
        var itemWeight = $$(this).attr("itemWeight");
        var itemIcon = $$(this).attr("itemIcon");
        var tempTotal = totalCost -  parseFloat(lastTotalCost);
        var tempTotalBuying = totalBuying -  parseFloat(itemBuying);
        var tempTotalWeight = totalWeight -  parseFloat(itemWeight);
        removeItemObj(itemListArray,id);
        totalCost = tempTotal;
        totalBuying = tempTotalBuying;
        totalWeight = tempTotalWeight;
        $$(".total-cost-div").text(currencyCode+" "+ totalCost.toFixed(2));
        $("[id='item-id"+id+"']").remove();
    }
    $$("[uniqueR='"+id+"']").html("<i class='material-icons' style='margin-top:5px;color:green;'>add_shopping_cart</i>").removeClass("remove-item").addClass("show-non-barcode-items-ul-link");
});
$$(document).on("click",".shop-reg-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    var shopName = $$(".shop-name-input").val();
    var adminName = $$(".admin-name-input").val();
    var shopAddress = $$(".shop-address-input").val();
    var adminPhone = $$(".admin-phone-input").val();
    var shopEmail = $$(".shop-email-input").val();
    var shopDes = $$(".shop-des-input").val();
    var shopCategory = $$(".shop-category-input").val();
    var password = $$(".shop-password-input").val();
    var password_v = $$(".shop-verify-input").val();
    var countryCode = '+' + $$(".select-country-code-input").val();
    var shopId = 'SI'+ Math.floor(Math.random()*899999+100000);
    var adminId = 'RI'+ Math.floor(Math.random()*89999+10000);
    var activationDate = Date.now();
    navigator.notification.confirm('By Clicking I Agree button, you are confirming that you will abide by our terms and condition. Click READ button for more else cancel',function(buttonIndex){
        if(buttonIndex==1){
            if(shopName!='' && shopAddress!='' && shopEmail!='' && password!='' && adminName!='' && shopDes!='' && adminPhone!=''){
                if(password.length>5){
                    if(password==password_v){
                        navigator.notification.confirm('Did you provide the correct details about your store?',function(buttonIndex){
                            if(buttonIndex==1){
                                socket.emit('register-shop',shopId,shopName,shopAddress,shopEmail,shopCategory,password,adminName,adminId,shopDes,adminPhone,countryCode,activationDate,function(cb,currency_code){
                                    myApp.hidePreloader();
                                    processing=false;
                                    if(cb==200){
                                        shopLogged = shopId;
                                        currentShopId = shopId;
                                        currentShopName = shopName;
                                        shopDescription = shopDes;
                                        stopProcess();
                                        $$(".shopNameShow").text(shopName.toUpperCase());
                                        mainView.router.load({pageName: 'shop-main-page'});
                                        currencyCode=currency_code;
                                        window.localStorage.setItem("currencyCode",currency_code);
                                        loggedIn=true;
                                        window.localStorage.setItem("shop-id",shopId)
                                        window.localStorage.setItem("shop-name",shopName);
                                        window.localStorage.setItem("shopDescription",shopDescription);
                                        window.localStorage.setItem("shopAddress",shopAddress);
                                        window.localStorage.setItem("shopPassword",password);
                                        window.localStorage.setItem("positionLogged",'ADMIN');
                                        window.localStorage.setItem("loggedUserId",adminId);
                                        loggedUserId=adminId;
                                        positionLogged = 'ADMIN';
                                        navigator.notification.alert('Your shop ID is '+shopId+' and your password is '+password+'. Please keep these credentials safe for they will be required on your next log in',null,'Hi, '+adminName,'ok');
                                    }else{
                                        showToast('There was an error in your registration, try using another email address!');
                                    }
                                });
                                processStatus(10000);
                            }
                        },'CONFIRM DETAILS',['Yes','No']);
                    }else{
                        showToast('password fields do not match!')
                    }
                }else{
                    showToast('password should be at least 6 characters long!');
                }
            }else{
                showToast('Please fill all the fields!')
            }
        }else if(buttonIndex==2){
            $$(".tnc-btn").click();
        }
    },'TERMS & CONDITION',['I AGREE','READ','CANCEL']);
});
$$(document).on("click",".shop-login-btn", function(e){
    var socket = deviceReady.returnSocket();
    myApp.modalLogin('','LOGIN BELOW TO ACCESS YOUR PANEL', function (email_address, password) {
        if (email_address!=''&&password!='') {
            socket.emit('login', email_address,password,function(result){
                if(result.length>0){
                    var position = result[0].position;
                    var userId = result[0].userId;
                    var shopId = result[0].shopId;
                    window.localStorage.setItem("positionLogged",position);
                    window.localStorage.setItem("loggedUserId",userId);
                    loggedUserId=userId;
                    positionLogged = position;
                    socket.emit('setShopDetails',shopId,function(res){
                        if(res.length>0){
                            var shopName = res[0].shopName;
                            var shopMerchant = res[0].shopMerchant;
                            var shopAddress = res[0].shopAddress;
                            var activationDate = res[0].activationDate;
                            var months = res[0].months;
                            var package = res[0].package;
                            var shopDes = res[0].shopDes;
                            var currency_code = res[0].currencyCode;
                            shopDescription=shopDes;
                            shopLogged = shopId;
                            currentShopId = shopId;
                            currentShopName = shopName;
                            userLogged='shop';
                            stopProcess();
                            $$(".shopNameShow").text(shopName.toUpperCase());
                            loggedIn=true;
                            currencyCode=currency_code;
                            window.localStorage.setItem("currencyCode",currencyCode);
                            window.localStorage.setItem("shop-id",shopId);
                            window.localStorage.setItem("shopDes",shopDes);
                            showToast('WELCOME '+position);
                            window.localStorage.setItem("shop-name",shopName);
                            window.localStorage.setItem("shopAddress",shopAddress);
                            window.localStorage.setItem("shopPassword",password);
                            checkActiveStatus(activationDate,months,package);
                            if(position=="WAITER/WAITRESS/DELIVERER"){
                                mainView.router.load({pageName: 'deliverer-main-page'});
                                getOrdersToDeliver();
                            }else{
                                mainView.router.load({pageName: 'shop-main-page'});
                            }
                            getActivationDate();
                        }
                    });
                }else{
                    navigator.notification.alert('Incorrect login credentials',function(){},'LOGIN FAILED','ok');
                }
            });
            processStatus(10000);
        }
    });
});
function getOrdersToDeliver(){
    var socket = deviceReady.returnSocket();
    $$(".orders-to-deliver-ul").html("");
    socket.emit("getOrdersToDeliver",currentShopId,function(result){
        if (result.length>0) {
            for (var i = 0; i < result.length; i++){
                var latitude=result[i].latitude;
                var longitude=result[i].longitude;
                var buyerNumber=result[i].buyerNumber;
                var order=result[i].id;
                $$(".orders-to-deliver-ul").prepend("<li><div class='item-content'><div class='item-inner'><div class='item-title'>ORDER #"+order+"</div><div class='item-after'><a href='#' class='button call-agent-btn' phone='"+buyerNumber+"'><i class='material-icons'>phone</i></a><a href='#' class='button getLocationBtn' latitude='"+latitude+"' longitude='"+longitude+"' shopName='"+order+"'><i class='material-icons color-teal'>location_on</i></a></div></div></div></li>");
            }
        }
    });
}
function checkActiveStatus(activationDate,months,p){
    if(p=='TRIAL'){
        var monthlyMilSec = (60*60) * 24 * 7 * 1000;
        trial = true;
    }else{
        var monthlyMilSec = (60*60) * 24 * (30 * parseInt(months)) * 1000;
        trial = false;
    }
    packageSubscribed=p;
    activationDate = parseFloat(activationDate);
    var dailyMills = 1000 * 60 * 60 * 24;
    var daysToOperate = (monthlyMilSec/dailyMills).toFixed(0);
    var thisTime = Date.now();
    var dif = thisTime - activationDate;
    var daysLeft = (dif/dailyMills).toFixed(0);
    if (daysToOperate > daysLeft) {
        accountActive = true;
    }else{
        accountActive = false;
    }
}
function getActivationDate(){
    var socket = deviceReady.returnSocket();
    var notificationOpenedCallback = function(jsonData) {};
    window.plugins.OneSignal.startInit("1c5b73c7-86a7-4bb3-89e3-5226a18b62fc","1007475238664").inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.Notification).handleNotificationOpened(notificationOpenedCallback).endInit();
    window.plugins.OneSignal.getIds(function(ids) {
        var playerId = ids.userId;
        if(userLogged=='shop' && positionLogged=='ADMIN'){
            socket.emit('updateAdminPlayerId',playerId,currentShopId);
        }else if(userLogged=='shop' && positionLogged!='ADMIN'){
            socket.emit('updateEmployeesPlayerId',playerId,loggedUserId);
        }else{
            if(phoneNo!=null){
                socket.emit('updateCustomerPlayerId',playerId,phoneNo);
            }
        }
    });
    if(currentShopId!=null && currentShopId!=''){
        getServiceAvailable();
        socket.emit('customerLogin',currentShopId,function(result){
            checkActiveStatus(result[0].activationDate,result[0].months,result[0].package);
        });
    }
}
function accountIsSuspended(){
    if(userLogged!='customer'){
        navigator.notification.confirm('Your account is currently running in a free mode. Subscribe to unlock premium features',function(buttonIndex){
            if(buttonIndex==1){
                mainView.router.load({pageName: 'select-package-page'});
            }
        },'ACTIVATE PREMIUM MODE',['Subscribe','Cancel']);
    }else{
        showToast('Account is currently not available, Please contact the store admin!')
    }
}
$$(document).on("click",".subscribe-btn", function(e){
    if(accountActive==false){
        accountIsSuspended();
    }else{
        navigator.notification.confirm('Your account is still in '+packageSubscribed+' mode, Click proceed to upgrade or downgrade',function(buttonIndex){
            if(buttonIndex==1){
                mainView.router.load({pageName: 'select-package-page'});
            }
        },packageSubscribed+' ACCOUNT',['Proceed','Cancel']);
    }
    getExtraCharges();
});
function getExtraCharges(){
    var socket = deviceReady.returnSocket();
    socket.emit("getExtraCharges",currentShopId,function(amount){
        extraCharges = amount;
    });
}
$$(document).on("click",".subscribe-now-btn", function(e){
    var amount = $$(this).attr("total");
    var newAmt = (parseFloat($$(this).attr("total")) + parseFloat(extraCharges)).toFixed(2);
    var month = $$(this).attr("month");
    var package = $$(this).attr("package");
    var activationTime = Date.now();
    navigator.notification.confirm('You have selected '+package+' package for '+month+' months, You will be redirected to paypal for secure payment. The additional service fee amount is the service fee you received from your customers. The total amount to be paid is $ '+newAmt,function(buttonIndex){
        if(buttonIndex==1){
            var inAppBrowserRef = cordova.InAppBrowser.open(serverUrl+'companySubscribe/'+currentShopId+'/activationTime/'+activationTime+'/amount/'+newAmt+'/package/'+package+'/month/'+month, '_blank', 'location=no');
            inAppBrowserRef.addEventListener('loadstart', function(event){
                if(event.url == "https://www.smartstoreweb.net/paymentSuccess"){
                    inAppBrowserRef.close();
                    paymentSuccess('subscription',true)
                }else if(event.url == "https://www.smartstoreweb.net/paymentError"){
                    paymentSuccess('subscription',false)
                    inAppBrowserRef.close();
                }else{
                    navigator.notification.activityStart('','Please Wait');
                }
            })
            inAppBrowserRef.addEventListener('loadstop', function(){
                navigator.notification.activityStop();
            });
        }
    },'TOTAL $'+parseFloat(amount).toFixed(2) +' + $'+parseFloat(extraCharges).toFixed(2)+' SERVICE FEES',['Proceed','Cancel']);
});
$$(document).on("change",".select-package-input", function(e){
    var package = $$(this).val();
    if(package=='BASIC'){
        $$(".package-details-ul").html("<li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>7 DAYS FREE</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>24/7 SUPPORT</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>SMART ORDER</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons' style='color:tomato;'>cancel</i></i></div><div class='item-inner'><div class='item-title'>POINT OF SALE</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons' style='color:tomato;'>cancel</i></i></div><div class='item-inner'><div class='item-title'>SALES REPORTS</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons' style='color:tomato;'>cancel</i></i></div><div class='item-inner'><div class='item-title'>SELF-CHECKOUT</div></div></div></li><li><a href='#' class='item-link smart-select'><select class='subscriptionMonths option-goBack' style='color:#757575;'><option value='1'>1</option><option value='2'>2</option><option value='3'>3</option><option value='4'>4</option><option value='5'>5</option><option value='6'>6</option><option value='7'>7</option><option value='8'>8</option><option value='9'>9</option><option value='10'>10</option><option value='11'>11</option><option value='12'>12</option></select><div class='item-content'><div class='item-media'><i class='icon material-icons color-teal'>today</i></div><div class='item-inner'><div class='item-title'>HOW MANY MONTHS?</div></div></div></a></li>");
        var amount = 4;
    }else if(package=='ADVANCED'){
        $$(".package-details-ul").html("<li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>7 DAYS FREE</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>24/7 SUPPORT</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>SMART ORDER</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>POINT OF SALE</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>SALES REPORTS</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons' style='color:tomato;'>cancel</i></i></div><div class='item-inner'><div class='item-title'>SELF-CHECKOUT</div></div></div></li><li><a href='#' class='item-link smart-select'><select class='subscriptionMonths option-goBack' style='color:#757575;'><option value='1'>1</option><option value='2'>2</option><option value='3'>3</option><option value='4'>4</option><option value='5'>5</option><option value='6'>6</option><option value='7'>7</option><option value='8'>8</option><option value='9'>9</option><option value='10'>10</option><option value='11'>11</option><option value='12'>12</option></select><div class='item-content'><div class='item-media'><i class='icon material-icons color-teal'>today</i></div><div class='item-inner'><div class='item-title'>HOW MANY MONTHS?</div></div></div></a></li>");
        var amount = 7;
    }else if(package=='COMMUNITY'){
        $$(".package-details-ul").html("<li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>7 DAYS FREE</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>24/7 SUPPORT</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>SMART ORDER</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>POINT OF SALE</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>SALES REPORTS</div></div></div></li><li><div class='item-content'><div class='item-media'><i class='material-icons color-green'>done</i></i></div><div class='item-inner'><div class='item-title'>SELF-CHECKOUT</div></div></div></li><li><a href='#' class='item-link smart-select'><select class='subscriptionMonths option-goBack' style='color:#757575;'><option value='1'>1</option><option value='2'>2</option><option value='3'>3</option><option value='4'>4</option><option value='5'>5</option><option value='6'>6</option><option value='7'>7</option><option value='8'>8</option><option value='9'>9</option><option value='10'>10</option><option value='11'>11</option><option value='12'>12</option></select><div class='item-content'><div class='item-media'><i class='icon material-icons color-teal'>today</i></div><div class='item-inner'><div class='item-title'>HOW MANY MONTHS?</div></div></div></a></li>");
        var amount = 50;
    }
    $$(".subscribe-now-btn,.subscriptionMonths").attr("total",amount).attr("month",1).attr('package',package);
    $$(".show-total-sub-div").text("$" + amount.toFixed(2));
});
$$(document).on("change",".subscriptionMonths", function(e){
    var amount = $$(this).attr("total");
    var month = $$(this).val();
    var totalAmount = parseFloat(amount) * parseFloat(month);
    $$(".show-total-sub-div").text("$" + totalAmount.toFixed(2));
    $$(".subscribe-now-btn").attr("total",totalAmount).attr("month",month);
});
$$(document).on("click",".proceed-add-item-btn", function(e){
    var itemName = $$(".item-name-input").val();
    var itemDesc = $$(".item-desc-input").val();
    var itemBuying = $$(".item-buying-input").val();
    var itemSelling = $$(".item-selling-input").val();
    var itemQuantity = $$(".item-quantity-input").val();
    var itemWeight = $$(".item-weight-input").val();
    var itemBarcode = $$(".item-barcode-input").val();
    var category = $$(".select-capture-category-input").val();
    var smartRestaurant = $$(".select-capture-sr-input").val();
    var itemIcon = $$(".media-preview-image").attr("uploadSrc");
    var date = Date.now();
    var itemUrl = "files/items/"+itemName+""+date+".png";
    if (itemName!='' && itemSelling!='' && itemBarcode!='' && itemWeight!='') {
        if(itemIcon==''){
            addItemFn(itemName,itemDesc,itemBuying,itemSelling,itemBarcode,itemQuantity,shopLogged,itemWeight,itemUrl,category,smartRestaurant);
            processStatus(10000);
        }else{
            uploadFile(itemIcon,itemUrl,"image/png",function(response){
                if(response=='success'){
                     addItemFn(itemName,itemDesc,itemBuying,itemSelling,itemBarcode,itemQuantity,shopLogged,itemWeight,itemUrl,category,smartRestaurant)
                }
            });
            processStatus(60000);
        }
    }else{
        showToast('Please fill in correctly!');
    }
});
function addItemFn(itemName,itemDesc,itemBuying,itemSelling,itemBarcode,itemQuantity,shopLogged,itemWeight,itemUrl,category,smartRestaurant){
    var socket = deviceReady.returnSocket();
    socket.emit('add-item',itemName, itemDesc,itemBuying,itemSelling,itemBarcode,'',getTime(),itemQuantity,shopLogged,itemWeight,itemUrl,category,smartRestaurant, function(cb,data){
        if (cb==200) {
            $$(".item-name-input,.item-desc-input,.item-buying-input,.item-selling-input,.item-quantity-input,.item-barcode-input,.item-weight-input").val("");
            $$(".media-preview-image").attr("uploadSrc","");
            navigator.notification.alert('item was successfully saved!',function(){},'SUCCESS','ok');
        }else{
            navigator.notification.alert(data,function(){},'FAILED','ok');
        }
        stopProcess();
    })
}
$$(document).on("click",".proceed-edit-item-btn", function(e){
    var socket = deviceReady.returnSocket();
    var itemName = $$(".edit-item-name-input").val();
    var itemDesc = $$(".edit-item-desc-input").val();
    var itemBuying = $$(".edit-item-buying-input").val();
    var itemSelling = $$(".edit-item-selling-input").val();
    var itemQuantity = $$(".edit-item-quantity-input").val();
    var itemId= $$(this).attr("id");
    if (itemName!='' && itemSelling!='') {
        socket.emit('update-item', itemName, itemDesc,itemBuying, itemSelling, itemQuantity, currentShopId, itemId, function(cb){
            if (cb==200) {
                navigator.notification.alert('item was successfully updated!',function(){},'SUCCESS','ok');
            }else{
                navigator.notification.alert('There was an error while trying to update an item!',function(){},'FAILED','ok');
            }
            stopProcess();
            navigator.app.backHistory(-2);
            $$(".manage-item-review").html("");
        })
        processStatus(10000);
    }else{
        myApp.alert('Please fill in correctly!')
    }
});
$$(document).on("click",".view-reports-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    var tempExpenses,tempDamages;
    $$(".sales-report-order-ul").html("");
    $$(".todate-total-price,.todate-profit-div").text(0);
    todateSales=0;todateProfit=0;
    if(positionLogged=='ADMIN'){
        socket.emit('shop-view-reports',shopLogged,function(result,res,expensesRes,damagedRes){
            customObj = res;
            if (result.length>0) {
                for (var i = 0; i < result.length; i++){
                    var purchaseDay=result[i].purchaseDay;
                    var purchaseMonth = purchaseDay.slice(0,7)
                    $$(".sales-report-order-ul").prepend("<li purchaseDay='"+purchaseDay+"' purchaseMonth='"+purchaseMonth+"'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>today</i></div><div class='item-inner'><div class='item-title'>"+purchaseDay+"</div><div class='item-after' purchaseDayTotal='"+purchaseDay+"'>0</div></div></div></li>");
                }
                if (res.length>0) {
                    for (var i = 0; i < res.length; i++){
                        var purchaseDay=res[i].purchaseDay;
                        var orderNumber=res[i].id;
                        var shopId=res[i].shopId;
                        var itemListString=res[i].itemListString;
                        var amount=res[i].amount;
                        var initAmount=res[i].initAmount;
                        if($("[purchaseDayTotal='"+purchaseDay+"']").length>0){
                            var thisAmount = parseFloat($("[purchaseDayTotal='"+purchaseDay+"']").text()) + parseFloat(amount);
                            $("[purchaseDayTotal='"+purchaseDay+"']").text(thisAmount.toFixed(2));
                        }
                        todateSales = todateSales + parseFloat(amount);
                        todateProfit = todateProfit + (parseFloat(amount) - parseFloat(initAmount));
                        $$(".todate-total-price").text(todateSales.toFixed(2));
                        $$(".todate-profit-div").text(todateProfit.toFixed(2));
                    }
                }
            }
            $$(".total-expenses-div").text(getTotals(expensesRes).toFixed(2));
            $$(".total-damages-div").text(getTotals(damagedRes).toFixed(2));
            tempDamages=damagedRes;tempExpenses=expensesRes;
        });
        mainView.router.load({pageName: 'view-reports-page'});
    }else{
        navigator.notification.alert('This is classified. You are not authorised',function(){},'PERMISSION DENIED','ok');
    }
    $$(document).on("click",".show-expenses-btn", function(e){
        if(accountActive==true){
            $$(".damage-expenses-ul").html("");
            mainView.router.load({pageName: 'damage-expenses-page'});
            $$(".add-damage-expense-btn").attr("title","expenses");
            $$(".damage-expenses-header").text("EXPENSES LIST");
            if(tempExpenses.length>0){
                for (var i = 0; i < tempExpenses.length; i++){
                    var id=tempExpenses[i].id;
                    var amount=tempExpenses[i].amount;
                    var description=tempExpenses[i].description;
                    var quantity=tempExpenses[i].quantity;
                    $$(".damage-expenses-ul").append("<div class='row no-gutter' style='color: #757575;'><div class='col-50' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+description+"</div><div class='col-25' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;'>"+quantity+"</div><div class='col-25' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+parseFloat(amount).toFixed(2)+"</div></div>");
                }
            }
        }else{
            accountIsSuspended();
        }
    });
    $$(document).on("click",".show-damages-btn", function(e){
        if(accountActive==true){
            $$(".damage-expenses-ul").html("");
            mainView.router.load({pageName: 'damage-expenses-page'});
            $$(".add-damage-expense-btn").attr("title","damages");
            $$(".damage-expenses-header").text("DAMAGED ITEMS LIST");
            if(tempDamages.length>0){
                for (var i = 0; i < tempDamages.length; i++){
                    var id=tempDamages[i].id;
                    var amount=tempDamages[i].amount;
                    var description=tempDamages[i].itemName;
                    var quantity=tempDamages[i].quantity;
                    $$(".damage-expenses-ul").append("<div class='row no-gutter' style='color: #757575;'><div class='col-50' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+description+"</div><div class='col-25' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;'>"+quantity+"</div><div class='col-25' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+parseFloat(amount).toFixed(2)+"</div></div>");
                }
            }
        }else{
            accountIsSuspended();
        }
    });
});
function getTotals(customObj){
    var total = 0;
    if(customObj.length>0){
        for (var i = 0; i < customObj.length; i++){
            total = total + parseFloat(customObj[i].amount)
        }
    }
    return total;
}
$$(document).on("click",".get-most-purchased-btn", function(e){
    if(accountActive==true){
        mainView.router.load({pageName: 'most-purchased-page'});
        var socket = deviceReady.returnSocket();
        socket.emit('get-most-purchased', currentShopId);
        processStatus(10000);
    }else{
        accountIsSuspended();
    }
});
$$(document).on("click",".add-damage-expense-btn", function(e){
    var action = $$(this).attr("title");
    if(action=="expenses"){
        mainView.router.load({pageName: 'add-expenses-page'});
    }else{
        mainView.router.load({pageName: 'item-manage-option-page'});
    }
});
$$(document).on("change",".sales-year-select,.sales-month-select", function(e){
    var year = $$(".sales-year-select").val();
    var month = $$(".sales-month-select").val();
    var getPurchaseMonth = year+"-"+month;
    $$(".sales-report-order-ul li").hide();
    $$("[purchaseMonth='"+getPurchaseMonth+"']").show();
});
$$(document).on("click",".view-total-sales-btn", function(e){
    if(accountActive==true){
        mainView.router.load({pageName: 'total-sales-page'});
    }else{
        accountIsSuspended();
    }
});
$$(document).on("click",".save-expense-btn", function(e){
    var socket = deviceReady.returnSocket();
    var description = $$(".expense-name-input").val();
    var quantity = $$(".expense-quantity-input").val();
    var amount = $$(".expense-amount-input").val();
    if(description!="" && quantity!="" && amount!=""){
        amount = parseFloat(amount) * parseFloat(quantity);
        navigator.notification.confirm('Add '+description+' to your expense with a total amount of '+amount.toFixed(2),function(buttonIndex){
            if(buttonIndex==1){
                socket.emit("addExpense",currentShopId,description,quantity,amount,function(cb){
                    stopProcess();
                    if(cb){
                        $(".view-reports-btn").click();
                        navigator.app.backHistory();
                        navigator.app.backHistory();
                        showToast("You have successfully added a new expense");
                    }
                })
                processStatus(10000);
            }
        },'CONFIRM EXPENSE',['Confirm','Cancel']);
    }else{
        showToast("Please fill out all fields!");
    }
});
$$(document).on("click",".sales-report-order-ul li",  function(e) {
    mainView.router.load({pageName: 'daily-sales-page'});
    var purchaseDay = $$(this).attr("purchaseDay");
    $$(".daily-sales-ul").html("");
    $(".daily-total-price,.daily-profit-div,.show-total-weight-sec").text(0);
    var dailyTotalSales = 0;
    var dailyTotalProfit = 0;
    for (var i = 0; i < customObj.length; i++){
        var id=customObj[i].id;
        var amount=customObj[i].amount;
        var initAmount=customObj[i].initAmount;
        var totalWeight = customObj[i].totalWeight;
        var purchaseDayObj=customObj[i].purchaseDay;
        var itemListString=customObj[i].itemListString;
        if(purchaseDay==purchaseDayObj){
            $$(".daily-sales-ul").prepend("<li totalWeight='"+totalWeight+"' itemListString='"+itemListString+"' order-sales-report='"+id+"' totalPrice='"+amount+"' initAmount='"+initAmount+"'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>check_circle</i></div><div class='item-inner'><div class='item-title'>ORDER "+id+"</div><div class='item-after'>"+parseFloat(amount).toFixed(2)+"</div></div></div></li>");
            var thisAmount = parseFloat($(".daily-total-price").text()) + parseFloat(amount);
            $(".daily-total-price").text(thisAmount.toFixed(2));
            var thisWeight = parseInt($(".show-total-weight-sec").text()) + parseInt(totalWeight);
            var totalWeightKg = (parseFloat(thisWeight) / 1000).toFixed(3);
            $$(".show-total-weight-sec").html(totalWeightKg+" KG");
            dailyTotalSales = dailyTotalSales + parseFloat(amount);
            dailyTotalProfit = dailyTotalProfit + (parseFloat(amount) - parseFloat(initAmount));
            $(".daily-profit-div").text(parseFloat(dailyTotalProfit).toFixed(2));
        }
    }
});
$$(document).on("click",".daily-sales-ul li",  function(e) {
    var itemListString = $$(this).attr("itemListString");
    var orderNumber = $$(this).attr("order-sales-report");
    var totalPrice = $$(this).attr("totalPrice");
    var initAmount = $$(this).attr("initAmount");
    var totalWeight = $$(this).attr("totalWeight");
    mainView.router.load({pageName: 'order-details-page'});
    $$(".customer-sales-show-div").hide();
    $$(".shop-sales-show-div").show();
    $$(".order-item-ul").html("");
    $(".order-total-price,.order-profit-div,.show-order-total-weight-sec").text(0);
    $$(".order-number-div").text("ORDER #"+orderNumber+" DETAILS");
    $$(".order-total-price").html(parseFloat(totalPrice).toFixed(2));
    var totalWeightKg = (parseFloat(totalWeight) / 1000).toFixed(3);
    $$(".show-order-total-weight-sec").html(totalWeightKg+" KG");
    var itemListStringToArray=JSON.parse(itemListString);
    var profit = parseFloat(totalPrice) - parseFloat(initAmount);
    $$(".order-profit-div").html(profit.toFixed(2));
    for (var i = 0; i < itemListStringToArray.length; i++){
        var price=itemListStringToArray[i].price;
        var itemName=itemListStringToArray[i].itemName;
        var quantity=itemListStringToArray[i].quantity;
        $$(".order-item-ul").prepend("<li><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>shopping_basket</i></div><div class='item-inner'><div class='item-title'>"+itemName+"</div><div class='item-after'>"+quantity+"*"+currencyCode+""+price+"</div></div></div></li>");
    }
});
$$(document).on("click",".remove-item-btn", function(e){
    var socket = deviceReady.returnSocket();
    var itemId = this.id;
    navigator.notification.confirm('This item will be removed from your store?',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('remove-item', itemId,function(cb){
                if(cb==200){
                    navigator.notification.alert('Item removal was success',function(){},'SUCCESS','ok');
                }
                stopProcess();
            });
            processStatus(10000);
        }
    },'CONFIRM REMOVAL',['Confirm','Cancel']);
});
$$(document).on("click",".view-users-btn", function(e){
    if(accountActive==true){
        getShopUsers();
        mainView.router.load({pageName: 'all-user-page'});
        processStatus(10000);
    }else{
        accountIsSuspended();
    }
});
function getShopUsers(){
    var socket = deviceReady.returnSocket();
    socket.emit('shop-get-users', currentShopId,function(result){
        stopProcess();
        if (result.length>0) {
            for (var i = 0; i < result.length; i++){
                var fname=result[i].fname;
                var position=result[i].position;
                var userId=result[i].userId;
                var staffEmail=result[i].staffEmail;
                var staffPass=result[i].staffPass;
                if($("[id='"+userId+"']").length==0){
                    if(positionLogged=='ADMIN'){
                        $$(".shop-users-li").prepend("<div class='card' id='"+userId+"' style='box-shadow:none;'><div class='card-header item-title'>"+fname+"</div><div class='card-content-inner'><div class='list-block'><ul><li><div class='item-content'><div class='item-inner'><div class='item-title'>POSITION</div><div class='item-after'>"+position+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>USER ID</div><div class='item-after'>"+userId+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>EMAIL</div><div class='item-after'>"+staffEmail+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>PASSWORD</div><div class='item-after'>"+staffPass+"</div></div></div></li></ul></div></div></div>");
                    }else{
                        if(userId==loggedUserId){
                            $$(".shop-users-li").prepend("<div class='card' id='"+userId+"' style='box-shadow:none;'><div class='card-header item-title'>"+fname+"</div><div class='card-content-inner'><div class='list-block'><ul><li><div class='item-content'><div class='item-inner'><div class='item-title'>POSITION</div><div class='item-after'>"+position+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>USER ID</div><div class='item-after'>"+userId+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>EMAIL</div><div class='item-after'>"+staffEmail+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>PASSWORD</div><div class='item-after'>"+staffPass+"</div></div></div></li></ul></div></div></div>");
                        }
                    }
                }
            }
        }
    });
}
$$(document).on("click",".proceed-add-user-btn", function(e){
    var socket = deviceReady.returnSocket();
    if(positionLogged=='ADMIN'){
        var fname = $$(".user-name-input").val();
        var staffEmail = $$(".user-email-input").val();
        var staffPhone = $$(".user-phone-input").val();
        var position = $$(".user-position-select").val();
        var userId = 'RI'+ Math.floor(Math.random()*89999+10000);
        var staffPass = '123456';
        if(fname!='' && position!='SELECT POSITION' && staffEmail!='' && staffPhone!=""){
            navigator.notification.confirm('Add '+fname+' as '+position+' ?',function(buttonIndex){
                if(buttonIndex==1){
                    socket.emit('shop-add-user',fname,position,userId,currentShopId,staffEmail,staffPass,staffPhone,function(cb){
                        if(cb==200){
                            getShopUsers();
                            navigator.notification.alert(fname+' has been added as '+position,function(){},'SUCCESS','ok');
                            navigator.app.backHistory();
                        }
                    });
                    processStatus(10000);
                }
            },'CONFIRM',['Confirm','Restart']);
        }else{
            showToast('Please fill in correctly')
        }
    }else{
        navigator.notification.alert('You are not authorized to perform this task!',function(){},'PERMISSION DENIED','ok');
    }
});
$$(document).on("click",".get-order-no-btn", function(e){
    var socket = deviceReady.returnSocket();
    if(accountActive==true){
        if((positionLogged=='ADMIN') || (positionLogged=='SECURITY OFFICER')){
            $$(".order-verify-ul").html("");
            navigator.notification.prompt('Get this from the customer',function(results){
                var orderNo=results.input1;
                if(results.buttonIndex==1){
                    if(orderNo!=''){
                        socket.emit('get-order-number', orderNo,function(cb,itemListString,amount,weight){
                            if(cb==200){
                                var itemListStringToArray=JSON.parse(itemListString);
                                mainView.router.load({pageName: 'verify-order-page'});
                                $$(".verify-order-show").text("ORDER #"+orderNo);
                                $$(".total-cost-div-v").text(currencyCode+" "+parseFloat(amount).toFixed(2));
                                $$(".verify-order-btn").attr("id",orderNo);
                                var totalWeightKg = (parseFloat(weight) / 1000).toFixed(3);
                                for (var i = 0; i < itemListStringToArray.length; i++){
                                    (function(x){
                                        setTimeout(function () {
                                            var price=itemListStringToArray[x].price;
                                            var itemName=itemListStringToArray[x].itemName;
                                            var quantity=itemListStringToArray[x].quantity;
                                            var itemId = itemListStringToArray[x].id;
                                            socket.emit('getItemOfSameMass', currentShopId,itemId,function(boolean){
                                                if(boolean==true){
                                                    //$$(".order-item-ul").prepend("<li item-list-receipt='same-same'><div class='item-content'><div class='item-inner'><div class='item-title' style='color: tomato;'>"+itemName+"</div><div class='item-after'>"+quantity+"*R"+price+"</div></div></div></li>");
                                                    $$(".order-verify-ul").prepend("<li><div class='item-content'><div class='item-media'><i class='material-icons'>blur_on</i></div><div class='item-inner'><div class='item-title' style='color: tomato;'>"+itemName+"</div><div class='item-after' style='color: tomato;'>"+quantity+" * "+currencyCode+" "+price+"</div></div></div></li>");
                                                }else{
                                                    $$(".order-verify-ul").prepend("<li><div class='item-content'><div class='item-media'><i class='material-icons'>blur_on</i></div><div class='item-inner'><div class='item-title'>"+itemName+"</div><div class='item-after'>"+quantity+" * "+currencyCode+" "+price+"</div></div></div></li>");
                                                }
                                            });
                                        }, 500 * i);
                                    })(i);
                                }
                                $$(".show-total-weight-sec").html("<center><a href='#' class='button' style='width: 200px; margin-top: 10px; color:#757575;'>"+ totalWeightKg +"Kg</a></center>");
                            }else{
                                navigator.notification.alert(itemListString,function(){},'ORDER NO ERROR!','ok');
                            }
                            stopProcess();
                        });
                        processStatus(10000);
                    }
                }
            },'ENTER ORDER NUMBER',['PROCEED','CANCEL']);
        }else{
            navigator.notification.alert('You are not authorized to perform this task!',function(){},'PERMISSION DENIED','ok');
        }
    }else{
        accountIsSuspended();
    }
});
$$(document).on("click",".verify-order-btn", function(e){
    var socket = deviceReady.returnSocket();
    var orderNo = this.id;
    navigator.notification.confirm('Your user ID will be added to verified by',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('verify-order', orderNo,loggedUserId,function(cb){
                if(cb==200){
                    navigator.notification.alert('Verification was success',function(){},'VERIFICATION SUCCESS','ok');
                }else{
                    navigator.notification.alert('Verification failed',function(){},'VERIFICATION ERROR','ok');
                }
                stopProcess();
            });
            processStatus(10000);
        }
    },'CONFIRM ORDER #'+orderNo,['Verify','Cancel']);
});
$$(document).on("click",".add-item-btn",  function(e) {
    if(accountActive==true){
        navigator.notification.confirm('You can add a new item or duplicate items from other stores',function(buttonIndex){
            if(buttonIndex==1){
                duplicateItems();
            }else{
                checkItemType('add');
            }
        },'YOUR CHOICE',['Duplicate','Add New']);
    }else{
        accountIsSuspended();
    }
});
$$(document).on("click",".scan-item-btn",  function(e) {
    if(shopLogged!=null){
        var shopId = shopLogged;
    }else{
        var shopId = currentShopId;
    }
    if(accountActive==true){
        if(packageSubscribed!="BASIC"){
            checkLogStatus(shopId,'POS','BARCODE');
        }else{
            showToast("UPGRADE TO ADVANCED TO CONTINUE");
        }
    }else{
        accountIsSuspended();
    }
});
$$(document).on("click",".pick-item-btn",  function(e) {
    if(shopLogged!=null){
        var shopId = shopLogged;
    }else{
        var shopId = currentShopId;
    }
    if(packageSubscribed!="BASIC"){
        checkLogStatus(shopId,'POS','NO BARCODE');
    }else{
        showToast("UPGRADE TO ADVANCED TO CONTINUE");
    }
});
$$(document).on("click",".manage-item-btn", function(e){
    if(accountActive==true){
        checkItemType('MANAGE');
    }else{
        accountIsSuspended();
    }
});
$$(document).on("click",".manage-items-page-btn", function(e){
    mainView.router.load({pageName: 'item-manage-option-page'});
});
function checkItemType(action){
    if(shopLogged!=null){
        var shopId = shopLogged;
    }else{
        var shopId = currentShopId;
    }
    myApp.actions([
       [
           {
               text: 'ITEM HAS BARCODE',
               onClick: function () {
                  if(action=='add'){
                    scanToAdd();
                  }else if(action=='POS'){
                    checkLogStatus(shopId,action,'BARCODE');
                  }else if(action=='MANAGE'){
                    scanToManage(shopId,action);
                  }
               }
           },
           {
            text: 'ITEM HAS NO BARCODE',
                onClick: function () {
                    if(action=='add'){
                        $$(".item-barcode-input").val('NO BARCODE');
                        mainView.router.load({pageName: 'shop-add-item-page'});
                    }else if(action=='MANAGE'){
                        getBarcodeItems(shopId,action,'NO BARCODE','NO BARCODE');
                        mainView.router.load({pageName: 'non-barcode-items-page'});
                    }
                }
            }
       ]
    ]);
}
$$(document).on("change",".get-shops-by-category-select",  function(e) {
    var socket = deviceReady.returnSocket();
    var category = $$(this).val();
    $$(".shops-to-dup-ul").html("");
    socket.emit("getItemsToDuplicateByCategory",category,function(result){
        stopProcess();
        displayToDuplicate(result);
    });
    processStatus(10000);
});
function duplicateItems(){
    var socket = deviceReady.returnSocket();
    $$(".shops-to-dup-ul").html("");
    navigator.notification.confirm('By duplicating items from another store, all of their items will be duplicated to your store ID.',function(buttonIndex){
        if(buttonIndex==1){
            mainView.router.load({pageName: 'shops-to-duplicate-page'});
            socket.emit("getItemsToDuplicate",function(result){
                stopProcess();
                displayToDuplicate(result);
            });
            processStatus(10000);
        }
    },'CONFIRM',['I AGREE','Cancel']);
}
function displayToDuplicate(result){
    if (result.length>0) {
        for (var i = 0; i < result.length; i++){
            var shopName=result[i].shopName;
            var shopId=result[i].shopId;
            $$(".shops-to-dup-ul").prepend("<li shopId='"+shopId+"' shopName='"+shopName+"'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>store</i></div><div class='item-inner'><div class='item-title'>"+shopName+"</div><div class='item-after'></div></div></div></li>");
        }
    }
}
$$(document).on("click",".shops-to-dup-ul li", function(e){
    var shopId = $$(this).attr("shopId");
    var shopName = $$(this).attr("shopName");
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('Duplicate items from '+shopName+'?. If you have once duplicated from this store, please find other stores since this will cause multiple duplication of the same item',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit("duplicateItems",currentShopId,shopId,function(cb){
                stopProcess();
                if(cb){
                    navigator.notification.alert('You have successfully duplicated items from '+shopName,function(){},'DUPLICATION SUCCESS','Done');
                }else{
                    showToast("There was an error while trying to duplicate items!");
                }
            });
            processStatus(10000);
        }
    },'CONFIRM',['Confirm','Cancel']);
});
function scanToManage(shopId,action){
    var socket = deviceReady.returnSocket();
    if(positionLogged=='ADMIN'){
        setTimeout(function(){
            window.plugins.GMVBarcodeScanner.scan({}, function(err, barcode) {
                if(!err){
                    if(barcode!=''){
                        getBarcodeItems(shopId,action,'BARCODE',barcode)
                    }
                }else{
                    showToast(err);
                }
            });
        },300)
        $$(".manage-item-review").html("");
    }else{
        navigator.notification.alert('You are not authorized to perform this task!',function(){},'PERMISSION DENIED','ok');
    }
}
function getBarcodeItems(shopId,action,status,barcode){
    var socket = deviceReady.returnSocket();
    socket.emit('getItemByBarcode', barcode,shopId,function(result){
        stopProcess();
        displayItems(action,status,result);
    });
    processStatus(10000);
}
$$(document).on("change",".get-items-by-category-input",  function(e) {
    var category = $$(this).val();
    displayItemsByCategory(category);
});
function displayItemsByCategory(category){
    var socket = deviceReady.returnSocket();
    socket.emit('getItemsByCategory', category,currentShopId,function(result){
        stopProcess();
        displayItems('POS','NO BARCODE',result);
    });
    processStatus(10000);
}
function displayItems(action,status,result){
    $$(".show-non-barcode-items-ul").html("");
    if (result.length>0) {
        for (var i = 0; i < result.length; i++){
            var id=result[i].id;
            var itemName=result[i].itemName;
            var itemDesc=result[i].itemDesc;
            var itemSelling=result[i].itemSelling;
            var itemQuantity=result[i].itemQuantity;
            var itemBuying=result[i].itemBuying;
            var itemWeight=result[i].itemWeight;
            var category=result[i].category;
            var itemIcon=result[i].itemIcon;

            var special=result[i].special;
            var discount=result[i].discount;
            var buyHowMany=result[i].buyHowMany;
            var getHowMany=result[i].getHowMany;
            var dueDate=result[i].specialDue;
            if(itemIcon==''){
                var itemIconDiv = "<i class='material-icons color-teal'>spa</i>";
            }else{
                var itemIconDiv = "<img src='"+serverUrl+itemIcon+"' style='width:35px;' class='itemIcon'>"
            }
            if (parseFloat(itemQuantity)>0) {
                if(action=='POS' && status=='BARCODE'){
                    displayItemsOnCart(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight,itemIcon,special,discount,buyHowMany,getHowMany,dueDate,false);
                    mainView.router.load({pageName: 'item-list-page'});
                }else if(action=='POS' && status=='NO BARCODE'){
                    //$$(".show-non-barcode-items-ul").prepend("<li><div class='item-content item-link'><div class='item-media'>"+itemIconDiv+"</div><div class='item-inner show-non-barcode-items-ul-li' action='"+action+"' id='"+id+"' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemSelling='"+itemSelling+"' itemQuantity='"+itemQuantity+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemIcon='"+itemIcon+"'><div class='item-title'>"+itemName+"</div><div class='item-after' style='font-weight:bold;'>"+currencyCode+" "+itemSelling+"</div></div></div></li>");
                    displayNonBarcodeItems(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight,itemIcon,action,special,discount,buyHowMany,getHowMany,dueDate);
                }else if(action=='MANAGE' && status=='BARCODE'){
                    displayToManage(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight);
                }else if(action=='MANAGE' && status=='NO BARCODE'){
                    //$$(".show-non-barcode-items-ul").prepend("<li><div class='item-content item-link'><div class='item-media'>"+itemIconDiv+"</div><div class='item-inner show-non-barcode-items-ul-li' action='"+action+"' id='"+id+"' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemSelling='"+itemSelling+"' itemQuantity='"+itemQuantity+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemIcon='"+itemIcon+"'><div class='item-title'>"+itemName+"</div><div class='item-after' style='font-weight:bold;'>"+currencyCode+" "+itemSelling+"</div></div></div></li>");
                    displayNonBarcodeItems(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight,itemIcon,action);
                }
            }else{
                showToast('we do not have '+itemName+' anymore!');
            }
        }
    }else{
        showToast('No item/items available');
    }
}
function isItemSpecial(id,special,discount,buyHowMany,getHowMany,dueDate,price){
    if(special=="DISCOUNT"){
        amount = (parseFloat(price) - parseFloat(discount)/100 * parseFloat(price)).toFixed(2);
        return amount+"::"+discount;
    }else if(special=="BUY SOME GET SOME FOR FREE"){
        return price+"::"+buyHowMany+"::"+getHowMany
    }else{
        return "";
    }
}
function displayNonBarcodeItems(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight,itemIcon,action,special,discount,buyHowMany,getHowMany,dueDate){
    var tempAmt = itemSelling;
    if(special!=""){
        var isItemSpecialArray = isItemSpecial(id,special,discount,buyHowMany,getHowMany,dueDate,itemSelling).split("::");
        if(special=="DISCOUNT"){
            itemSelling = isItemSpecialArray[0]
            var showAlert = "<span style='color:orange;' class='special-info-btn' title='You have "+discount+"% off until "+dueDate+"'>-"+discount+"%</span>"
        }else{
            itemSelling = itemSelling;
            var showAlert = "<i class='material-icons color-orange special-info-btn' title='Buy "+buyHowMany+" and get "+getHowMany+" for free until "+dueDate+"'>grade</i>"
        }
    }else{
        var showAlert = ""
    }
    if(action=='POS'){
        var minIcon = "<i class='material-icons color-green' style='margin-top:5px;'>add_shopping_cart</i>";
        showAlert = showAlert;
    }else if(action=='MANAGE'){
        var minIcon = "<i class='material-icons color-purple' style='margin-top:5px;'>edit</i>";
        showAlert = "";
    }
    if(itemIcon==''){
        var itemIconDiv = "<i class='material-icons color-teal' style='font-size:80px;'>spa</i>";
    }else{
        var itemIconDiv = "<img src='"+serverUrl+itemIcon+"' style='max-width:100%;' class='itemIcon1'>"
    }
    if($(".rm-second-col-pos").length!=0){
        $$(".rm-second-col-pos").html("<div class='card' style='border-radius:20px;box-shadow:none;'><div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+showAlert+" "+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center>"+itemIconDiv+"</center></div><div class='card-footer'><a href='#' class='link' style='font-size:10px;font-weight:bold;color:#757575;'>"+parseFloat(itemSelling).toFixed(2)+"</a><a href='#' class='link show-non-barcode-items-ul-link' action='"+action+"' id='"+id+"' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemSelling='"+itemSelling+"' itemQuantity='"+itemQuantity+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemIcon='"+itemIcon+"' uniqueR='"+id+"' title"+id+"="+itemSelling+" special='"+special+"' buyHowMany='"+buyHowMany+"' getHowMany='"+getHowMany+"' discount='"+discount+"' dueDate='"+dueDate+"'>"+minIcon+"</a></div></div>");
        $$(".second-col-pos").removeClass("rm-second-col-pos");
    }else{
        $$(".show-non-barcode-items-ul").append("<div class='row'> <div class='col-50'><div class='card' style='border-radius:20px;box-shadow:none;'> <div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+showAlert+" "+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center>"+itemIconDiv+"</center></div><div class='card-footer'><a href='#' class='link' style='font-size:10px;font-weight:bold;color:#757575;'>"+parseFloat(itemSelling).toFixed(2)+"</a><a href='#' class='link show-non-barcode-items-ul-link' action='"+action+"' id='"+id+"' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemSelling='"+itemSelling+"' itemQuantity='"+itemQuantity+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemIcon='"+itemIcon+"' uniqueR='"+id+"' title"+id+"="+itemSelling+" special='"+special+"' buyHowMany='"+buyHowMany+"' getHowMany='"+getHowMany+"' discount='"+discount+"' dueDate='"+dueDate+"'>"+minIcon+"</a></div></div></div>  <div class='col-50 second-col-pos rm-second-col-pos'></div>");
    }
}
function displayToManage(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight){
    var expectedProfit = parseFloat(itemSelling) - parseFloat(itemBuying)
    mainView.router.load({pageName: 'manage-item-page'});
    $$(".manage-item-review").html("<div class='card'><div class='card-header item-title' style='background:#e9eaed;'>"+itemName+"</div><div class='card-content'><div class='card-content-inner'><div class='list-block'><ul><li><div class='item-content'><div class='item-inner'><div class='item-title'>"+itemDesc+"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>CURRENT COST</div><div class='item-after'>"+currencyCode+" "+ parseFloat(itemSelling).toFixed(2) +"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>BUYING PRICE</div><div class='item-after'>"+currencyCode+" "+ parseFloat(itemBuying).toFixed(2) +"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>EXPECTED PROFIT</div><div class='item-after'>"+currencyCode+" "+ expectedProfit.toFixed(2) +"</div></div></div></li><li><div class='item-content'><div class='item-inner'><div class='item-title'>ITEMS LEFT</div><div class='item-after'>"+itemQuantity+"</div></div></div></li></ul></div></div></div><div class='card-footer' style='width:100%;'><div class='row' style='width:100%;'><div class='col-50' style='border-right: 2px solid #e9eaed;'><center><a href='#' class='button remove-item-btn' id="+id+"><i class='material-icons' style='font-size:30px; color: tomato;'>cancel</i></a></center></div><div class='col-50'><center><a href='#' class='button edit-item-btn' id='"+id+"'><i class='material-icons' style='font-size:30px; color: #757575;'>edit</i></a></center></div></div></div></div>")
    $$(".edit-item-name-input").val(itemName);
    $$(".edit-item-desc-input").val(itemDesc);
    $$(".edit-item-buying-input").val(itemBuying);
    $$(".edit-item-selling-input").val(itemSelling);
    $$(".edit-item-quantity-input").val(itemQuantity);
    $$(".proceed-edit-item-btn").attr("id",id);
}
$$(document).on("click",".edit-item-btn",  function(e) {
    var itemName = $$(".edit-item-name-input").val();
    var amount = $$(".edit-item-selling-input").val();
    var id = $$(this).attr("id");
    myApp.actions([
       [
           {
               text: 'UPDATE ITEM INFO',
               onClick: function () {
                   mainView.router.load({pageName: 'edit-item-page'});
               }
           },{
               text: 'ADD ITEM TO DAMAGED GOODS',
               onClick: function () {
                  addItemToDamaged(id,itemName,amount);
               }
           },{
               text: 'ADD TO SPECIALS',
               onClick: function () {
                  addToSpecial(id,itemName,amount);
               }
           },{
               text: 'REMOVE FROM SPECIALS',
               onClick: function () {
                  removeFromSpecial(id,itemName,amount);
               }
           }
       ]
    ]);
});
$$(document).on("click",".special-info-btn",  function(e) {
    showToast($(this).attr("title"));
});
function addToSpecial(id,itemName,amount){
    mainView.router.load({pageName: 'add-item-special-page'});
    $$(".special-item-show-li").text(itemName+"("+amount+")");
    $$(".save-special-btn").attr("id",id).attr("itemName",itemName);
}
function removeFromSpecial(id,itemName,amount){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('Are you sure you want to remove '+itemName+' from specials?',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit("removeFromSpecial",id,function(cb){
                stopProcess();
                if(cb){
                    showToast("You have successfully removed "+itemName+" from specials!");
                }else{
                    showToast("Could not remove this item from specials!");
                }
            });
            processStatus(10000);
        }
    },'CONFIRM SPECIAL',['Confirm','Cancel']);
}
$$(document).on("change",".special-select",  function(e) {
    var special = $$(this).val();
    if(special=="DISCOUNT"){
        $$(".discount-li").show();$$(".buyGet").hide();
    }else{
        $$(".discount-li").hide();$$(".buyGet").show();
    }
});
$$(document).on("click",".save-special-btn",  function(e) {
    var special = $$(".special-select").val();
    var discount = $$(".special-discount-input").val();
    var buyHowMany = $$(".buy-how-many-input").val();
    var getHowMany = $$(".get-how-many-input").val();
    var dueDate = $$(".special-due-input").val();
    var socket = deviceReady.returnSocket();
    var itemId = this.id;
    var itemName = $$(this).attr("itemName");
    if(special=="DISCOUNT"){
        if(discount!=""){
            var canContinue=true;
        }else{
            var canContinue=false;
        }
    }else{
        if(buyHowMany!="" && getHowMany!=""){
            var canContinue=true;
        }else{
            var canContinue=false;
        }
    }
    if(canContinue){
        navigator.notification.confirm('Are you sure you want to add '+itemName+' to the selected special?',function(buttonIndex){
            if(buttonIndex==1){
                getGPS(function(latitude,longitude){
                    socket.emit("addToSpecial",special,discount,buyHowMany,getHowMany,dueDate,itemId,currentShopName,currentShopId,latitude,longitude,function(cb){
                        stopProcess();
                        if(cb){
                            showToast("You have successfully added "+itemName+" to "+special+" special!");
                        }else{
                            showToast("Could not add this item to special!");
                        }
                    });
                });
                processStatus(10000);
            }
        },'CONFIRM SPECIAL',['Confirm','Cancel']);
    }else{
        showToast("Please fill out all fields to proceed!");
    }
});
function addItemToDamaged(id,itemName,amount){
    var socket = deviceReady.returnSocket();
    navigator.notification.prompt('Are you sure you want to add '+itemName+' to damaged goods? Press proceed to add',function(res){
        var quantity=res.input1;
        if(res.buttonIndex==1){
            if(quantity!=''){
                amount = parseFloat(quantity) * amount;
                socket.emit("addItemToDamaged",currentShopId,id,itemName,quantity,amount,function(cb){
                    stopProcess();
                    if(cb){
                        showToast(itemName+" has been added to damaged goods");
                    }
                });
                processStatus(10000);
            }else{
                showToast("Please enter damaged goods quantity!")
            }
        }
    },'ENTER QUANTITY',['PROCEED','CANCEL']);
}
function formatted_date(d){
    var result="";
    if (d.getDate()>9) {
        var date = d.getDate();
    }else{
        var date = "0" + d.getDate();
    }
    if ((d.getMonth()+1) > 9) {
        var month = (d.getMonth()+1);
    }else{
        var month = "0" + (d.getMonth()+1);
    }
    result += d.getFullYear()+"-"+month+"-"+date;
    return result;
}
$$(document).on("click",".show-non-barcode-items-ul-link",  function(e) {
    var id = $$(this).attr("id");
    var itemName = $$(this).attr("itemName");
    var itemDesc = $$(this).attr("itemDesc");
    var itemSelling = $$(this).attr("itemSelling");
    var itemQuantity = $$(this).attr("itemQuantity");
    var itemBuying = $$(this).attr("itemBuying");
    var itemWeight = $$(this).attr("itemWeight");
    var action = $$(this).attr("action");
    var itemIcon = $$(this).attr("itemIcon");
    var buyHowMany = $$(this).attr("buyHowMany");
    var getHowMany = $$(this).attr("getHowMany");
    var dueDate = $$(this).attr("dueDate");
    var discount = $$(this).attr("discount");
    var special = $$(this).attr("special");
    if(action=='POS'){
        displayItemsOnCart(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight,itemIcon,special,discount,buyHowMany,getHowMany,dueDate,true);
        $$("[uniqueR='"+id+"']").html("<i class='material-icons' style='margin-top:5px;color:tomato;'>cancel</i>").addClass("remove-item").removeClass("show-non-barcode-items-ul-link");
    }else if(action=='MANAGE'){
        displayToManage(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight);
    }
});
function displayItemsOnCart(id,itemName,itemDesc,itemSelling,itemQuantity,itemBuying,itemWeight,itemIcon,special,discount,buyHowMany,getHowMany,dueDate,deducted){
    if(itemIcon==''){
        var itemIconDiv = "<i class='material-icons color-teal'>spa</i>";
    }else{
        var itemIconDiv = "<img src='"+serverUrl+itemIcon+"' style='width:30px;border-radius:100%;' class='itemIcon'>"
    }
    if(special!=""){
        var isItemSpecialArray = isItemSpecial(id,special,discount,buyHowMany,getHowMany,dueDate,itemSelling).split("::");
        if(special=="DISCOUNT"){
            if(deducted==false){
                itemSelling = isItemSpecialArray[0]
            }else{
                itemSelling = itemSelling;
            }
            var showAlert = "<span style='color:orange;' class='special-info-btn' title='You have "+discount+"% off until "+dueDate+"'>-"+discount+"%</span>"
        }else{
            itemSelling = itemSelling;
            var showAlert = "<i class='material-icons color-orange special-info-btn' title='Buy "+buyHowMany+" and get "+getHowMany+" for free until "+dueDate+"'>grade</i>"
        }
    }else{
        var showAlert = "";
        itemSelling = itemSelling;
    }
    if($("[id='item-id"+id+"']").length==0){
        $$(".item-list-page-content").prepend("<div class='card item-card-show ks-facebook-card' id='item-id"+id+"' style='box-shadow:none;border-radius:10px;'><div class='card-header no-border'><div class='ks-facebook-avatar'>"+itemIconDiv+"</div><div class='ks-facebook-name'>"+showAlert+" "+itemName.toUpperCase()+"</div></div><div class='card-footer'><a href='#' class='link' style='font-size: 12px; color:#757575;font-weight:bold;' id='quantity-div"+id+"'>1 * "+itemSelling+" = "+currencyCode+" "+itemSelling+"</a><a href='#' class='link remove-item' id='"+id+"' title"+id+"='"+itemSelling+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemIcon='"+itemIcon+"'><i class='material-icons color-red'>cancel</i></a><a href='#' class='link update-quantity' style='color:#757575;' id="+id+" price='"+itemSelling+"' last-total='"+itemSelling+"' itemName='"+itemName+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemIcon='"+itemIcon+"'><i class='material-icons'>add<sup>remove</sup></i></a></div></div>");
        totalCost = totalCost + parseFloat(itemSelling);
        totalWeight = totalWeight + parseFloat(itemWeight);
        totalBuying = totalBuying + parseFloat(itemBuying);
        $$(".total-cost-div").text(currencyCode+" "+ totalCost.toFixed(2));
        itemListArray.push({id:id, price:itemSelling, totalPrice:itemSelling, quantity:1, itemName:itemName, itemIcon:encodeURIComponent(itemIcon)})
    }else{
        showToast('You already have that item on your cart, You may update it instead')
    }
}
function checkLogStatus(shopId,action,status){
    var socket = deviceReady.returnSocket();
    if((userLogged=='customer') || ((positionLogged=='POS OPERATOR')||(positionLogged=='ADMIN'))){
        if(((positionLogged=='POS OPERATOR' || positionLogged=='ADMIN') && (currentTill!='')) || (userLogged=='customer')){
            if(status=='BARCODE'){
                setTimeout(function(){
                    window.plugins.GMVBarcodeScanner.scan({}, function(err, barcode) {
                        if(!err){
                           if(barcode!=''){
                               getBarcodeItems(shopId,action,status,barcode);
                           }
                        }else{
                            showToast(err);
                        }
                    });
                },300)
            }else if(status=='NO BARCODE'){
                getBarcodeItems(shopId,action,status,'NO BARCODE');
                mainView.router.load({pageName: 'non-barcode-items-page'});
            }
        }else{
            navigator.notification.prompt('',function(res){
                var tillNo=res.input1;
                if(res.buttonIndex==1){
                    if(tillNo!=''){
                        currentTill = tillNo;
                    }
                }
            },'ENTER YOUR TILL NUMBER',['PROCEED','CANCEL']);
        }
    }else{
        navigator.notification.alert('You are not authorized to perform this task!',function(){},'PERMISSION DENIED','ok');
    }
}
function scanToAdd(){
    var socket = deviceReady.returnSocket();
    if(positionLogged=='ADMIN'){
        window.plugins.GMVBarcodeScanner.scan({}, function(err, barcode) {
            if(!err){
                if(barcode!=''){
                    $$(".item-barcode-input").val(barcode);
                    mainView.router.load({pageName: 'shop-add-item-page'});
                    socket.emit('findBarcodeDetails', barcode,function(cb,itemName,itemDesc,itemWeight,itemSelling,itemBuying){
                        stopProcess();
                        if(cb==200){
                            $$(".item-name-input").val(itemName);
                            $$(".item-desc-input").val(itemDesc);
                            $$(".item-buying-input").val(itemBuying);
                            $$(".item-selling-input").val(itemSelling);
                            $$(".item-weight-input").val(itemWeight);
                        }
                    });
                    processStatus(5000);
                }
            }else{
                showToast(err);
            }
        });
    }else{
        navigator.notification.alert('You are not authorized to perform this task!',function(){},'PERMISSION DENIED','ok');
    }
}
$$(document).on("click",".shop-edit-btn", function(e){
    var shopDes = $$(".shop-description-input-edit").val();
    var shopName = $$(".shop-name-input-edit").val();
    var shopAddress = $$(".shop-address-input-edit").val();
    var shopPassword = $$(".shop-password-input-edit").val();
    var password_v = $$(".shop-verify-input-edit").val();
    var operationalRadius = $$(".operational-radius-input").val();
    if(shopName!='' && shopAddress!='' && shopPassword!=''){
        if(shopPassword.length>5){
            if(shopPassword==password_v){
                updateStore(shopDes,shopAddress,shopName,shopPassword,currentShopId,operationalRadius);
            }else{
                showToast('Your password fields do not match!')
            }
        }else{
            showToast('Your password field should be at least 6 characters long!')
        }
    }else{
        showToast('Please fill in all the required fields!')
    }
});
function updateStore(shopDes,shopAddress,shopName,shopPassword,currentShopId,operationalRadius){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('Your store details will be changed?',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('update-store', shopDes,shopAddress,shopName,shopPassword,currentShopId,operationalRadius,function(cb){
                if(cb==200){
                    navigator.notification.alert('Your store details has been changed',function(){},'UPDATE SUCCESS','ok');
                    window.localStorage.setItem("shop-name",shopName);
                    window.localStorage.setItem("shopDescription",shopDes);
                    window.localStorage.setItem("shopAddress",shopAddress);
                    window.localStorage.setItem("shopPassword",shopPassword);
                    window.localStorage.setItem("radius",radius);
                    radius = operationalRadius;
                }else{
                    navigator.notification.alert('There was an error while trying to update',function(){},'UPDATE FAILED','ok');
                }
                stopProcess();
            });
            processStatus(10000);
        }
    },'CONFIRM UPDATE',['Confirm','Cancel']);
}
$$(document).on("click",".search-item-btn", function(e){
    var socket = deviceReady.returnSocket();
    var radius = $$(".search-radius-input").val();
    var itemInput = $$(".search-item-input").val();
    $$(".item-search-found").html("");
    mainView.router.load({pageName: 'item-search-res-page'});
    getGPS(function(latitude,longitude){
        socket.emit('search-item',latitude,longitude,radius,itemInput);
    });
    processStatus(15000);
});
function updateLocation(time){
    var socket = deviceReady.returnSocket();
    webGPS(function(latitude,longitude){})
    setTimeout(function(){
        getGPS(function(latitude,longitude){
            socket.emit('updateLocation', latitude,longitude,currentShopId);
            var newTime = 1000*60*10;
            updateLocation(newTime);
        })
    },time);
    if(userIsDriver!=null){
        updateDriverLocation(time);
    }
}
function updateDriverLocation(time){
    var socket = deviceReady.returnSocket();
    webGPS(function(latitude,longitude){})
    setTimeout(function(){
        getGPS(function(latitude,longitude){
            var notificationOpenedCallback = function(jsonData) {};
            window.plugins.OneSignal
            .startInit("1c5b73c7-86a7-4bb3-89e3-5226a18b62fc","1007475238664")
            .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.Notification)
            .handleNotificationOpened(notificationOpenedCallback)
            .endInit();
            window.plugins.OneSignal.getIds(function(ids) {
                var playerId = ids.userId;
                socket.emit('updateDriverLocation', latitude,longitude,phoneNo,playerId);
                var newTime = 1000*60*3;
                updateDriverLocation(newTime);
            });
        })
    },time);
}
function getGPS(cb){
    if(currentLatitude==null && currentLongitude==null){
        GPSLocation.getCurrentPosition(function(position){
            currentLatitude = position.coords.latitude;
            currentLongitude = position.coords.longitude;
            cb(currentLatitude,currentLongitude);
        },function(error){
            showToast(error.message+' ----')
        });
    }else{
        cb(currentLatitude,currentLongitude);
        GPSLocation.getCurrentPosition(function(position){
            currentLatitude = position.coords.latitude;
            currentLongitude = position.coords.longitude;
        },null);
    }
}
function webGPS(cb){
    navigator.geolocation.getCurrentPosition(function(position){
        abc = 0;
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        cb(latitude,longitude);
    }, function(err){
        if(abc < 4){
            abc++;
        }else{
            abc = 0;
        }
        showToast('GPS currently not detected, Re-initiating ...');
    }, {enableHighAccuracy: false, timeout: 10*1000, maximumAge: 1000*60*10});
}
$$(document).on("click",".smart-order-log-btn", function(e){
    navigator.notification.confirm('Select below to access menu portal',function(buttonIndex){
        if(buttonIndex==1){
            if(phoneNo!=null){
                customerLogin();
            }else{
                changeNumber();
            }
        }else if(buttonIndex==2){
            staffLogin();
        }
    },'LOGIN AS ?',['CUSTOMER','STAFF']);
});
function staffLogin(){
    myApp.modalLogin('','LOGIN BELOW', function (email_address, password) {
        loginFn(email_address,password);
    });
}
function customerLogin(){
    var socket = deviceReady.returnSocket();
    navigator.notification.prompt('Enter store id to view their menu',function(results){
        var storeId=results.input1;
        if(results.buttonIndex==1){
            socket.emit("customerLogin",storeId,function(result){
                if (result.length>0) {
                    loggedInUser = phoneNo;
                    window.localStorage.setItem("loggedInUser",loggedInUser);
                    $$(".companyNameH1").text(result[0].shopName.toUpperCase());
                    currentShopId = result[0].shopId;
                    currencyCode=result[0].currencyCode;
                    remotePurchase = result[0].remoteOrdering;
                    currentShopName = result[0].shopName;
                    var shopLatitude = result[0].latitude;
                    var shopLongitude = result[0].longitude;
                    smartDriver = result[0].smartDriver;
                    distanceFromStore = getDistance(currentLatitude,currentLongitude,shopLatitude,shopLongitude).toFixed(1);
                    checkActiveStatus(result[0].activationDate,result[0].months,result[0].package)
                    mainView.router.load({pageName: 'smart-order-main'});
                    isStoreOpen(result[0].workingHours);
                    getRandomItems();
                    getActivationDate();
                }else{
                    myApp.alert("Sorry, We couldn't find any store with the ID you have entered!");
                }
                stopProcess();
            });
            processStatus(10000);
        }
    },'ENTER STORE ID',['PROCEED','CANCEL']);
}
function loginFn(email_address,password){
    var socket = deviceReady.returnSocket();
    socket.emit('loginStaff',email_address,password,function(result){
        if (result.length>0) {
          userDetails = result;
          $$(".username-btn").text(userDetails[0].fname);
          loggedInUser = result[0].staffEmail;
          window.localStorage.setItem("loggedInUser",email_address);
          window.localStorage.setItem("password",password);
          $$(".companyNameH1").text(userDetails[1].storeName.toUpperCase());
          currentShopId = userDetails[0].shopId;
          currencyCode=userDetails[1].currencyCode;
          window.localStorage.setItem("currencyCode",currencyCode);
          mainView.router.load({pageName: 'smart-order-main'});
          getRandomItems();
        }else{
          myApp.alert('Invalid login credentials.')
        }
        stopProcess();
    });
    processStatus(10000);
}
function getServiceAvailable(){
    var socket = deviceReady.returnSocket();
    if(currentShopId!==null && currentShopId!=''){
        socket.emit('getServiceAvailable',currencyCode,currentShopId,function(service_fee,result,paypalRes){
            if(userLogged=="shop"){
                serviceFee = 0;
            }else{
                serviceFee = parseFloat(service_fee);
            }
            paypalObj = paypalRes;
            paymentGatewayObj = result;
        })
    }
}
function getRandomItems(){
    var socket = deviceReady.returnSocket();
    socket.emit("getSmartRestaurant",currentShopId,function(result){
        viewedItems = result;
        if (result.length>0) {
            for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var url=result[i].itemIcon;
                var itemName=result[i].itemName;
                var itemPrice=result[i].itemSelling;
                var itemQuantity=result[i].itemQuantity;
                var itemDes=result[i].itemDesc;
                var itemBuying=result[i].itemBuying;
                var itemWeight=result[i].itemWeight;
                if(url!=""){
                    var fileUrl = serverUrl+url;
                }else{
                    var fileUrl = "https://image.iol.co.za/image/1/process/620x349?source=https://cdn.africannewsagency.com/public/ana/media/media/2018/06/20/media-reference%3Aac7696ea3d3c4c2993efe0dfff55520a.jpg&operation=CROP&offset=0x278&resize=5315x2984";
                }
                $$(".display-items-ul").prepend("<div class='card' all-list-card='"+id+"' style='border-radius:20px;box-shadow:none;'>  <div class='card-header' style='font-size:11px;color:#757575;font-weight:bold;'>"+itemName.toUpperCase()+" ("+currencyCode+" "+itemPrice+")</div>  <div class='card-content card-content-img' id='"+id+"' itemPrice='"+itemPrice+"'><center><img src='"+fileUrl+"' class='itemIcon'></center></div><div class='card-footer' style='font-size:15px; font-weight:bold;'><a href='#' class='link' itemCostText='id"+id+"' quantity='0' style='font-size:9px;'>"+itemPrice+"(0) = 0</a><a href='#' class='link subtract-item-btn' itemIcon='"+url+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' id='"+id+"' itemPrice='"+itemPrice+"' quantity='0' itemCost='id"+id+"' itemName='"+itemName+"'><i class='material-icons' style='margin-top: 7px; color:#757575;'>exposure_neg_1</i></a><a href='#' class='link add-more-item-btn' itemIcon='"+url+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' id='"+id+"' itemPrice='"+itemPrice+"' quantity='0' itemCost='id"+id+"' itemName='"+itemName+"'><i class='material-icons' style='margin-top: 7px; color:#757575;'>exposure_plus_1</i></a><a href='#' class='link remove-smart-item-btn' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemPrice='"+itemPrice+"' id='"+id+"' quantity='0' itemCost='id"+id+"'><i class='material-icons' style='margin-top: 7px; color:tomato;'>cancel</i></a></div> </div>");
            }
        }
    });
}
$$(document).on("change",".get-smart-res-random",  function(e) {
    var socket = deviceReady.returnSocket();
    $$(".display-items-ul").html("");
    var category = $$(this).val();
    socket.emit('getSmartRestaurantItemsByCategory',category,currentShopId,function(result){
       if (result.length>0) {
            for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var url=result[i].itemIcon;
                var itemName=result[i].itemName;
                var itemPrice=result[i].itemSelling;
                var itemQuantity=result[i].itemQuantity;
                var itemDes=result[i].itemDesc;
                var itemBuying=result[i].itemBuying;
                var itemWeight=result[i].itemWeight;
                var quantity = getQuantity(id);
                if(url!=""){
                    var fileUrl = serverUrl+url;
                }else{
                    var fileUrl = "https://image.iol.co.za/image/1/process/620x349?source=https://cdn.africannewsagency.com/public/ana/media/media/2018/06/20/media-reference%3Aac7696ea3d3c4c2993efe0dfff55520a.jpg&operation=CROP&offset=0x278&resize=5315x2984";
                }
                $$(".display-items-ul").prepend("<div class='card' all-list-card='"+id+"' style='border-radius:20px;box-shadow:none;'>   <div class='card-header' style='font-size:11px;color:#757575;font-weight:bold;'>"+itemName.toUpperCase()+" ("+currencyCode+""+itemPrice+")</div>  <div class='card-content card-content-img' id='"+id+"' itemPrice='"+itemPrice+"'><center><img src='"+fileUrl+"' class='itemIcon'></center></div><div class='card-footer' style='font-size:15px; font-weight:bold;'><a href='#' class='link' itemCostText='id"+id+"' quantity='"+quantity+"' style='font-size:9px;'>"+itemPrice+"("+quantity+") = "+parseFloat(quantity)*parseFloat(itemPrice)+"</a><a href='#' class='link subtract-item-btn' itemIcon='"+url+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' id='"+id+"' itemPrice='"+itemPrice+"' quantity='"+quantity+"' itemCost='id"+id+"' itemName='"+itemName+"'><i class='material-icons' style='margin-top: 7px; color:#757575;'>exposure_neg_1</i></a><a href='#' class='link add-more-item-btn' itemIcon='"+url+"' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' id='"+id+"' itemPrice='"+itemPrice+"' quantity='"+quantity+"' itemCost='id"+id+"' itemName='"+itemName+"'><i class='material-icons' style='margin-top: 7px; color:#757575;'>exposure_plus_1</i></a><a href='#' class='link remove-smart-item-btn' itemBuying='"+itemBuying+"' itemWeight='"+itemWeight+"' itemPrice='"+itemPrice+"' id='"+id+"' quantity='"+quantity+"' itemCost='id"+id+"'><i class='material-icons' style='margin-top: 7px; color:tomato;'>cancel</i></a></div> </div>");
            }
       }
    });
});
$$(document).on("click",".add-more-item-btn",  function(e) {
    var id = $$(this).attr("id");
    var itemName = $$(this).attr("itemName");
    var itemPrice = parseFloat($$(this).attr("itemPrice"));
    var itemBuying = $$(this).attr("itemBuying");
    var itemWeight = $$(this).attr("itemWeight");
    var itemIcon = $$(this).attr("itemIcon");
    totalCost=totalCost+itemPrice;
    totalBuying = totalBuying + parseFloat(itemBuying);
    totalWeight = totalWeight + parseFloat(itemWeight);
    $$(".show-total-amount,.total-cost-div").text(currencyCode+" "+totalCost.toFixed(2));
    var quantity = parseFloat($$(this).attr("quantity"));
    quantity++;
    $$("[itemCost='id"+id+"']").attr("quantity",quantity);
    $$("[itemCostText='id"+id+"']").html(itemPrice+"("+quantity+") = "+ itemPrice*quantity);
    removeItemObj(itemListArray,id);
    var cost = itemPrice*quantity;
    itemListArray.push({id:id, price:itemPrice, totalPrice:cost, quantity:quantity, itemName:itemName, itemIcon:encodeURIComponent(itemIcon)})
});
$$(document).on("click",".subtract-item-btn",  function(e) {
    var id = $$(this).attr("id");
    var itemName = $$(this).attr("itemName");
    var itemPrice = parseFloat($$(this).attr("itemPrice"));
    var quantity = parseFloat($$(this).attr("quantity"));
    var itemBuying = $$(this).attr("itemBuying");
    var itemWeight = $$(this).attr("itemWeight");
    var itemIcon = $$(this).attr("itemIcon");
    $$("[all-order-card='"+id+"']").remove();
    removeItemObj(itemListArray,id);
    if (totalCost>0) {
        if (quantity>0) {
            totalCost=totalCost - itemPrice;
            $$(".show-total-amount,.total-cost-div").text(currencyCode+" "+totalCost.toFixed(2));
            quantity--;
            totalBuying = totalBuying - parseFloat(itemBuying);
            totalWeight = totalWeight - parseFloat(itemWeight);
            $$("[all-order-card='"+id+"']").remove();
            $$("[itemCost='id"+id+"']").attr("quantity",quantity);
            $$("[itemCostText='id"+id+"']").html(itemPrice+"("+quantity+") = "+ itemPrice*quantity);
            var cost = itemPrice*quantity;
            itemListArray.push({id:id, price:itemPrice, totalPrice:cost, quantity:quantity, itemName:itemName, itemIcon:encodeURIComponent(itemIcon)})
        }
    }
});
function dialogBeep(times) {
  navigator.notification.beep(times);
}
$$(document).on("click",".remove-smart-item-btn",  function(e) {
    var id = $$(this).attr("id");
    var itemPrice = parseFloat($$(this).attr("itemPrice"));
    var quantity = parseFloat($$(this).attr("quantity"));
    $$("[all-order-card='"+id+"']").remove();
    removeItemObj(itemListArray,id);
    if (quantity!=0) {
        totalCost=totalCost - (itemPrice * quantity);
        $$("[itemCost='id"+id+"']").attr("quantity",'0');
        $$(".show-total-amount,.total-cost-div").text(currencyCode+" "+totalCost.toFixed(2));
        $$("[itemCostText='id"+id+"']").html(itemPrice+"(0) = "+ itemPrice);
        totalBuying = totalBuying - (parseFloat(itemBuying) * quantity);
        totalWeight = totalWeight - (parseFloat(itemWeight) * quantity);
    }else{
        removeItemObj(itemListArray,id);
    }
});
$$(document).on("click",".go-to-cart-btn",  function(e) {
    $$(".display-items-cart-ul").html("");
    if (itemListArray.length>0) {
        for (var i = 0; i < itemListArray.length; i++){
            var id=itemListArray[i].id;
            var quantity=itemListArray[i].quantity;
            var url = getLocalItems(id,viewedItems,'itemIcon');
            if(url!=""){
                var itemIcon = serverUrl+url;
            }else{
                var itemIcon = "https://image.iol.co.za/image/1/process/620x349?source=https://cdn.africannewsagency.com/public/ana/media/media/2018/06/20/media-reference%3Aac7696ea3d3c4c2993efe0dfff55520a.jpg&operation=CROP&offset=0x278&resize=5315x2984";
            }
            $$(".display-items-cart-ul").prepend("<div class='card' all-order-card='"+id+"' style='border-radius:20px;box-shadow:none;'>  <div class='card-header' style='font-size:11px;color:#757575;font-weight:bold;'>"+getLocalItems(id,viewedItems,'itemName').toUpperCase()+" ("+currencyCode+" "+getLocalItems(id,viewedItems,'itemPrice')+")</div>  <div class='card-content card-content-img' id='"+id+"' itemPrice='"+getLocalItems(id,viewedItems,'itemPrice')+"'><center><img src='"+itemIcon+"' class='itemIcon'></center></div><div class='card-footer' style='font-size:15px; font-weight:bold;'><a href='#' class='link' itemCostText='id"+id+"' quantity='"+quantity+"' style='font-size:9px;'>"+getLocalItems(id,viewedItems,'itemPrice')+"("+quantity+") = "+parseFloat(quantity)*parseFloat(getLocalItems(id,viewedItems,'itemPrice'))+"</a><a href='#' class='link subtract-item-btn' itemIcon='"+url+"' itemBuying='"+getLocalItems(id,viewedItems,'itemBuying')+"' itemWeight='"+getLocalItems(id,viewedItems,'itemWeight')+"' id='"+id+"' itemPrice='"+getLocalItems(id,viewedItems,'itemPrice')+"' itemName='"+getLocalItems(id,viewedItems,'itemName')+"' quantity='"+quantity+"' itemCost='id"+id+"'><i class='material-icons' style='margin-top: 7px; color:#757575;'>exposure_neg_1</i></a><a href='#' class='link add-more-item-btn' itemIcon='"+url+"' itemBuying='"+getLocalItems(id,viewedItems,'itemBuying')+"' itemWeight='"+getLocalItems(id,viewedItems,'itemWeight')+"' id='"+id+"' itemPrice='"+getLocalItems(id,viewedItems,'itemPrice')+"' quantity='"+quantity+"' itemCost='id"+id+"' itemName='"+getLocalItems(id,viewedItems,'itemName')+"'><i class='material-icons' style='margin-top: 7px; color:#757575;'>exposure_plus_1</i></a><a href='#' class='link remove-smart-item-btn' itemBuying='"+getLocalItems(id,viewedItems,'itemBuying')+"' itemWeight='"+getLocalItems(id,viewedItems,'itemWeight')+"' itemPrice='"+getLocalItems(id,viewedItems,'itemPrice')+"' id='"+id+"' quantity='"+quantity+"' itemCost='id"+id+"'><i class='material-icons' style='margin-top: 7px; color:tomato;'>cancel</i></a></div> </div>");
        }
    }
});
$$(document).on("click",".get-all-categories",  function(e) {
    var socket = deviceReady.returnSocket();
    socket.emit("getCategories", currentShopId,function(result){
        if (result.length>0) {
            for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var category=result[i].category;
                if($$("[category='id"+id+"']").length==0){
                    $$(".display-categories-ul").append("<li id="+id+" category='id"+id+"' name='"+category+"'><div class='item-content'><div class='item-media'><i class='material-icons color-white'>local_dining</i></div><div class='item-inner'> <div class='item-title color-white'>"+category+"</div><div class='item-after'></div></div></div></li>");
                }
            }
        }
    });
});
$$(document).on("click",".itemIcon,.itemIcon1",  function(e) {
    var photoBrowserPhotos = [];
    photoBrowserPhotos.push({url: $(this).attr("src"), caption: ''})
    myApp.photoBrowser({
        photos: photoBrowserPhotos,
        theme: 'dark',
    }).open();
});
$$(document).on("click",".ask-for-waiter-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    myApp.prompt('Enter table number where you want the waiter to come','ENTER TABLE NUMBER',function(tableNo){
        socket.emit('askForWaiter',currentShopId,tableNo,function(cb){
            stopProcess();
            navigator.notification.alert('A waiter is on his way. Thank you!', null, 'WAITER CALLED','Done');
        });
        processStatus(10000,"Calling waiter, Please waiter");
    });
});
$$(document).on("click",".pawn-btn",  function(e) {
    if(phoneNo!=null){
        navigator.notification.confirm('Select your option',function(buttonIndex){
            if(buttonIndex==1){
                pawnOrSellFn('PAWN');
            }else if(buttonIndex==2){
                pawnOrSellFn('SELL');
            }
        },'CONFIRM',['PAWN','SELL']);
    }else{
        changeNumber();
    }
});
$$(document).on("click",".driver-upload-photo-btn",  function(e) {
    var buttonClicked = $$(this).attr("title");
    navigator.notification.confirm('You can choose from Camera or Gallery or Remove photo',function(buttonIndex){
        if(buttonIndex==1){
            openGalleryD(buttonClicked);
        }else if(buttonIndex==2){
            openCameraD(buttonClicked);
        }
    },'CHOOSE FROM',['Gallery','Camera']);
});
function openGalleryD(buttonClicked){
   navigator.camera.getPicture(onSuccess, null, { quality: 100,
      destinationType: Camera.DestinationType.FILE_URL,
      sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
      mediaType:Camera.MediaType.ALLMEDIA,
      allowEdit: true,
        targetWidth:800,
        targetHeight:800
   });
   function onSuccess(fileUri) {
     fileUri = 'file://' + fileUri;
     plugins.crop(function success (path) {
          $(".media-preview-image").attr("src", window.Ionic.WebView.convertFileSrc(path)).attr('uploadSrc',path);
          $$("#"+buttonClicked).html("<center><img src='"+window.Ionic.WebView.convertFileSrc(path)+"' id='id-"+buttonClicked+"' uploadSrc='"+path+"' style='max-width:100%;'></center>");
          mainView.router.load({pageName: 'media-preview-page'});
      }, function fail () {

      }, fileUri, { quality: 100 })
   }
}
function openCameraD(buttonClicked){
    navigator.camera.getPicture(onSuccess, null, {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URL
    });
    function onSuccess(fileUri) {
        plugins.crop(function success (path) {
            $(".media-preview-image").attr("src",window.Ionic.WebView.convertFileSrc(path)).attr('uploadSrc',path);
            $$("#"+buttonClicked).html("<center><img src='"+window.Ionic.WebView.convertFileSrc(path)+"' id='id-"+buttonClicked+"' uploadSrc='"+path+"' style='max-width:100%;'></center>");
            mainView.router.load({pageName: 'media-preview-page'});
        }, function fail () {

        }, fileUri, { quality: 100 })
    }
}
$$(document).on("click",".driver-account-btn",  function(e) {
    if(phoneNo!=null){
        $$(".driver-phone-input").val(phoneNo);
        getMyDriverAccount()
    }else{
        changeNumber();
    }
});
$$(document).on("click",".payout-details-btn",  function(e) {
    var payoutEmail = $$(this).attr("payoutEmail");
    var socket = deviceReady.returnSocket();
    navigator.notification.prompt('Your current paypal payout email is '+payoutEmail+'. Provide another to change.',function(results){
        var newPayoutEmail=results.input1;
        if(results.buttonIndex==1){
            if(newPayoutEmail!=''){
                navigator.notification.confirm('Are you sure you want to change your current email to '+newPayoutEmail+'?',function(buttonIndex){
                    if(buttonIndex==1){
                        socket.emit("updatePayoutEmail",phoneNo,newPayoutEmail,function(cb){
                            showToast("Your new payout email is "+newPayoutEmail);
                            stopProcess();
                        });
                        processStatus(10000);
                    }
                },'CONFIRM',['Change','Cancel']);
            }else{
                showToast('Paypal email is missing!')
            }
        }
    },'CHANGE PAYOUT EMAIL',['PROCEED','CANCEL']);
});
function getMyDriverAccount(){
    var socket = deviceReady.returnSocket();
    socket.emit("getMyDriverAccount",phoneNo,function(result){
        stopProcess();
        if(result.length>0){
            mainView.router.load({pageName: 'driver-main-page'});
            userIsDriver = true;
            window.localStorage.setItem("userIsDriver",true);
            $$(".driver-bal-div").text(parseFloat(result[0].balance).toFixed(2));
            $$(".myCurrencyCode").text(myCurrencyCode);
            $$(".driver-fname-div").text(result[0].fname);
            $$(".work-status-div").text(result[0].status);
            $$(".payout-details-btn").attr("payoutEmail",result[0].payoutEmail)
            $$(".verified-status-div").text(result[0].verified);
        }else{
            mainView.router.load({pageName: 'drivers-create-account-page'});
        }
    });
    processStatus(10000);
}
$$(document).on("click",".create-driver-btn",  function(e) {
    var fname = $$(".driver-fname-input").val();
    var payoutEmail = $$(".paypal-email-input").val();
    var transportType = $$(".transport-type-select").val();
    var driverAvatar = $$("#id-avatar-photo").attr("uploadSrc");
    var licencePhoto = $$("#id-driver-licence-photo").attr("uploadSrc");
    var frontView = $$("#id-front-view-photo").attr("uploadSrc");
    var sideView = $$("#id-side-view-photo").attr("uploadSrc");
    var driverPhotoUrl = "files/items/"+phoneNo+"driverPhotoUrl.png";
    var licencePhotoUrl = "files/items/"+phoneNo+"licencePhotoUrl.png";
    var frontViewUrl = "files/items/"+phoneNo+"frontViewUrl.png";
    var sideViewUrl = "files/items/"+phoneNo+"sideViewUrl.png";
    var socket = deviceReady.returnSocket();
    if(fname!="" && payoutEmail!="" && transportType!="transport-type-select"){
        navigator.notification.confirm('Please confirm your details carefully, you may not be able to alter once approved!',function(buttonIndex){
            if(buttonIndex==1){
                uploadFile(driverAvatar,driverPhotoUrl,"image/png",function(response){
                    if(response=='success'){
                        uploadFile(licencePhoto,licencePhotoUrl,"image/png",function(response){
                            if(response=='success'){
                                uploadFile(frontView,frontViewUrl,"image/png",function(response){
                                    if(response=='success'){
                                        uploadFile(sideView,sideViewUrl,"image/png",function(response){
                                            if(response=='success'){
                                                getGPS(function(latitude,longitude){
                                                   socket.emit("createDriverAccount",fname,phoneNo,driverPhotoUrl,licencePhotoUrl,frontViewUrl,sideViewUrl,transportType,latitude,longitude,payoutEmail,function(cb){
                                                       stopProcess();
                                                       if(cb){
                                                           showToast("Account created and it is now in a demo mode until verification!");
                                                           getMyDriverAccount();
                                                       }else{
                                                           showToast("Error while trying to create an account!");
                                                       }
                                                   });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                processStatus(120000);
            }
        },'CONFIRM',['Confirm','Cancel']);
    }else{
        showToast("Your full name is required!");
    }
});
$$(document).on("click",".shop-pawn-item-btn",  function(e) {
    if(phoneNo!=null){
        navigator.notification.confirm('Select your option',function(buttonIndex){
            if(buttonIndex==1){
                shopPawnOrSellFn('PAWN');
            }else if(buttonIndex==2){
                shopPawnOrSellFn('BUY');
            }
        },'CONFIRM',['PAWN','SELL']);
    }else{
        changeNumber();
    }
});
$$(document).on("click",".get-customer-care-button",  function(e) {
    mainView.router.load({pageName: 'customer-care-page'});
    var socket = deviceReady.returnSocket();
    $$(".customer-care-ul").html("");
    socket.emit("getCustomerCare",currentShopId,function(result){
        if(result.length>0){
            for (var i = 0; i < result.length; i++){
                var fname=result[i].fname;
                var staffPhone=result[i].staffPhone;
                $$(".customer-care-ul").prepend("<li><div class='item-content'><div class='item-media'><i class='material-icons color-teal'>person_outline</i></div><div class='item-inner'><div class='item-title'>"+fname+"</div><div class='item-after'><a href='#' class='button whatsApp-btn' phoneNo='"+staffPhone+"'><img src='images/whatsapp.png' style='width:18px;'></a></div></div></div></li>");
            }
        }
    })
});
$$(document).on("click",".whatsApp-btn",  function(e) {
    var staffPhone = $$(this).attr("phoneNo");
    window.location = 'https://api.whatsapp.com/send?phone='+staffPhone+'';
});
$$(document).on("click",".check-order-btn",  function(e) {
    getOrders('getOrdersShop');
    mainView.router.load({pageName: 'manage-order-page'});
});
$$(document).on("click",".manage-order-btn",  function(e) {
    getOrders('getOrdersCustomer');
    mainView.router.load({pageName: 'manage-order-page'});
});
$$(document).on("click",".new-order-btn",  function(e) {
    mainView.router.load({pageName: 'driver-manage-order-page'});
    driverGetJob('driverGetJob');
});
$$(document).on("click",".previous-order-btn",  function(e) {
    mainView.router.load({pageName: 'driver-prev-job-page'});
    driverGetJob('driverPrevJobs');
});
var jobCounter=0;
function driverGetJob(option){
    var socket = deviceReady.returnSocket();
    $$(".driver-new-job-ul").html("");
    $$(".driver-busy-div").hide();
    jobCounter=0;
    getGPS(function(latitude,longitude){
        socket.emit(option, latitude,longitude,phoneNo,function(result,res){
            if (result.length>0) {
                for (var i = 0; i < result.length; i++){
                    var id=result[i].id;
                    var orderObj=result[i].itemListString;
                    var total=result[i].amount;
                    var status=result[i].status;
                    var location=result[i].location;
                    var latitude=result[i].latitude;
                    var longitude=result[i].longitude;
                    var shopName=result[i].shopName;
                    var shopId=result[i].shopId;
                    var paidFor=result[i].paidFor;
                    var totalWeight=result[i].totalWeight;
                    var delivery_fee=result[i].deliveryFee;
                    var distance=result[i].distanceFromStore;
                    var buyerNumber=result[i].buyerNumber;
                    var deliverer=result[i].deliverer;
                    var fString = shopName.split(' ')[0];
                    var userStatus = res[0].status;
                    if (paidFor=='PAID') {
                        var paidForDiv = "<i class='material-icons color-teal' style='font-size:14px;'>check_circle</i>";
                    }else{
                        var paidForDiv = "<i class='material-icons' style='font-size:14px;color:tomato;'>lens</i>";
                    }
                    if(option=='driverGetJob'){
                        if(userStatus=='FREE'){
                            var workStatusDiv = "<i class='material-icons color-gray' style='font-size:14px;'>lens</i>";
                            var workStatus = "FREE";
                        }else{
                            jobCounter++;
                            if((deliverer==phoneNo) && (status=='READY')){
                                var workStatusDiv = "<i class='material-icons color-orange' style='font-size:14px;'>favorite_border</i>";
                                var workStatus = "READY";
                            }else if((deliverer==phoneNo) && (status=='PICKED')){
                                var workStatusDiv = "<i class='material-icons color-teal' style='font-size:14px;'>directions_car</i>";
                                var workStatus = "PICKED";
                            }
                        }
                        $$(".driver-new-job-ul").append("<div class='row no-gutter no-gutter-big-new-driver open-popover' data-popover='.driver-order-option-popover' style='color: #757575;' workStatus='"+workStatus+"' shopName='"+shopName+"' order='id"+id+"' id='"+id+"' shopId='"+shopId+"' total='"+total+"' location='"+location+"' status='"+status+"' latitude='"+latitude+"' longitude='"+longitude+"' buyerNumber='"+buyerNumber+"' delivery_fee='"+delivery_fee+"'><div class='col-15' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;'>"+id+"</div><div class='col-40' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+fString+"("+distance+")</div><div class='col-25' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+parseFloat(delivery_fee).toFixed(2)+"</div><div class='col-20' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;'>"+workStatusDiv+"</div></div>");
                    }else{
                        if (status=='COLLECTED') {
                            var completeStatus = "<i class='material-icons color-teal' style='font-size:14px;'>check_circle</i>";
                        }else{
                            var completeStatus = "<i class='material-icons' style='font-size:14px;color:tomato;'>lens</i>";
                        }
                        $$(".driver-new-job-ul").append("<div class='row no-gutter' style='color: #757575;'><div class='col-35' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+fString+"</div><div class='col-15' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;'>"+distance+"</div><div class='col-25' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;'>"+completeStatus+"</div><div class='col-25' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+parseFloat(delivery_fee).toFixed(2)+"</div></div>");
                    }
                }
            }
        })
    });
}
$$(document).on("click",".no-gutter-big-new-driver",  function(e) {
    var shopId = $$(this).attr("shopId");
    var latitude = $$(this).attr("latitude");
    var longitude = $$(this).attr("longitude");
    var delivery_fee = $$(this).attr("delivery_fee");
    var buyerNumber = $$(this).attr("buyerNumber");
    var id = $$(this).attr("id");
    var work = $$(this).attr("id");
    var workStatus = $$(this).attr("workStatus");
    if(workStatus=="FREE"){
        $$(".b4-accept-option").show();$$(".order-picked-option,.cancel-this-job-option").hide();
    }else if(workStatus=="READY"){
        $$(".b4-accept-option").hide();$$(".order-picked-option,.cancel-this-job-option").show();
    }else if(workStatus=="PICKED"){
        $$(".order-picked-option,.cancel-this-job-option,.b4-accept-option").hide();
    }
    $$(".driver-order-option-ul li a").attr("shopId",shopId).attr("latitude",latitude).attr("longitude",longitude).attr("delivery_fee",delivery_fee).attr("buyerNumber",buyerNumber).attr("id",id);
});
$$(document).on("click",".driver-order-option-ul li a",  function(e) {
    var shopId = $$(this).attr("shopId");
    var latitude = $$(this).attr("latitude");
    var longitude = $$(this).attr("longitude");
    var delivery_fee = $$(this).attr("delivery_fee");
    var buyerNumber = $$(this).attr("buyerNumber");
    var id = $$(this).attr("id");
    var action = $$(this).attr("title");
    if(action=="ACCEPT THIS JOB"){
        if(jobCounter < 4){
            driverAcceptJob(id,delivery_fee);
        }else{
            showToast("You have enough job to do. Quickly complete the ones marked as favorite!")
        }
    }else if(action=="PICK UP LOCATION"){
        getShopGeo(shopId);
    }else if(action=="DROP UP LOCATION"){
        getDirection(latitude,longitude,'DROP LOCATION');
    }else if(action=="CONTACT OWNER"){
        window.location = 'tel:'+buyerNumber;
    }else if(action=="MARK AS DELIVERED"){
        markAsDelivered(id,delivery_fee,buyerNumber);
    }else if(action=="ORDER PICKED"){
        changeOrderStatus(id,'PICKED','status','By picking up this order, you agree you will deliver it?',phoneNo);
        setTimeout(function(){driverGetJob('driverGetJob')},500)
    }else if(action=="CANCEL THIS JOB"){
        cancelThisJob(id);
    }
});
function getShopGeo(shopId){
    var socket = deviceReady.returnSocket();
    socket.emit("customerLogin",shopId,function(result){
        var latitude = result[0].latitude;
        var longitude = result[0].longitude;
        var label = result[0].shopName;
        getDirection(latitude,longitude,label);
    })
}
function cancelThisJob(id){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('Are you sure you want to cancel this Job? Punishment fees may apply?',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit("driverCancelJob", id,phoneNo,function(cb){
                stopProcess();
                showToast("Job cancelled successfully!");
                driverGetJob('driverGetJob');
            });
            processStatus(10000);
        }
    },'CONFIRM UPDATE',['Proceed','Cancel']);
}
function markAsDelivered(id,delivery_fee,buyerNumber){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('Press proceed then wait for the purchaser to confirm delivery. After confirmation, collect '+myCurrencyCode+' '+parseFloat(delivery_fee).toFixed(2)+' from the purchaser',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit("driverMarkJobAsDone", id,buyerNumber,delivery_fee,phoneNo);
            processStatus(60000);
        }
    },'MARK THIS JOB AS DONE',['Proceed','Cancel']);
}
function confirmDelivery(id,delivery_fee,deliverer){
    var socket = deviceReady.returnSocket();
    socket.emit("buyerConfirmDelivery",id,delivery_fee,deliverer,function(cb){
        stopProcess();
        if(cb){
            navigator.notification.alert('Thank you for confirming your order. Please pay '+parseFloat(delivery_fee).toFixed(2)+' to the driver',function(){},'ORDER CONFIRMED','ok');
        }else{
            showToast("There was an error while trying to confirm this order!")
        }
    });
    processStatus(10000);
}
function driverAcceptJob(id,delivery_fee){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('Once the purchaser confirms the delivery you will be rewarded with '+myCurrencyCode+' '+parseFloat(delivery_fee).toFixed(2)+'. Click on the pickup location button for directions',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit("driverAcceptJob", id,phoneNo,function(cb){
                stopProcess();
                if(cb){
                    showToast("Congrats, The job is yours. Quickly deliver to the drop location to proceed to the next job!");
                    driverGetJob('driverGetJob');
                }else{
                    showToast("Oops, your application was not success!");
                }
            });
            processStatus(10000);
        }
    },'ACCEPT THIS JOB',['Accept','Cancel']);
}
function getOrders(action){
    var socket = deviceReady.returnSocket();
    $$(".card-show-bodies-ul").html("");
    $$(".waiting-order-div").show();
    $$(".order-card").hide();
    if(action=="getOrdersShop"){
        $$(".mark-as-ready-btn,.mark-as-paid-btn").show();
        $$(".mark-as-delivered-btn").hide();
    }else{
        $$(".mark-as-ready-btn,.mark-as-paid-btn").hide();
        $$(".mark-as-delivered-btn").show();
    }
    socket.emit(action, currentShopId,phoneNo,function(result){
        if (result.length>0) {
            for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var orderObj=result[i].itemListString;
                var total=result[i].amount;
                var status=result[i].status;
                var location=result[i].location;
                var latitude=result[i].latitude;
                var longitude=result[i].longitude;
                var paidFor=result[i].paidFor;
                var shopId=result[i].shopId;
                var shopName=result[i].shopName;
                var deliverer=result[i].deliverer;
                displayOrders(id,orderObj,total,status,location,'old',latitude,longitude,paidFor,shopId,shopName,deliverer);
            }
        }
    })
}
function displayOrders(id,orderObj,total,status,location,oldStatus,latitude,longitude,paidFor,shopId,shopName,deliverer){
    if (location=='remote') {
        location = "REMOTE";
    }else if (location=='local') {
        location = "LOCAL"
    }else{
        location = "TABLE "+location;
    }
    if (status=='COLLECTED') {
        statusDiv = "<i class='material-icons color-teal' style='font-size:14px;'>check_circle</i>";
    }else if (status=='READY') {
        statusDiv = "<i class='material-icons color-orange' style='font-size:14px;'>done</i>";
    }else if (status=='PICKED') {
        statusDiv = "<i class='material-icons color-orange' style='font-size:14px;'>directions_car</i>";
    }else{
        statusDiv = "<i class='material-icons' style='font-size:14px;color:tomato;'>lens</i>";
    }
    if (paidFor=='PAID') {
        paidForDiv = "<i class='material-icons color-teal' style='font-size:14px;'>check_circle</i>";
    }else{
        paidForDiv = "<i class='material-icons' style='font-size:14px;color:tomato;'>lens</i>";
    }
    if(userLogged!="shop"){
        getShopDetails(shopId);
        location = shopName.split(' ')[0];
    }
    $$(".card-show-bodies-ul").append("<div class='row no-gutter no-gutter-big' style='color: #757575;' deliverer='"+deliverer+"' paidFor='"+paidFor+"' order='id"+id+"' id='"+id+"' orderObj='"+orderObj+"' total='"+total+"' location='"+location+"' status='"+status+"'><div class='col-25' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+id+"</div><div class='col-35' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;' fromShop='"+shopId+"'>"+location+"</div><div class='col-25' style='border-right: 1px solid #ccc;border-bottom: 1px solid #ccc;padding-left: 10px;'>"+statusDiv+"</div><div class='col-15' style='border-right: 1px solid #ccc; padding-left: 10px;border-bottom: 1px solid #ccc;'>"+paidForDiv+"</div></div>");
}
function getShopDetails(shopId){
    var socket = deviceReady.returnSocket();
    socket.emit("customerLogin",shopId,function(result){
        currencyCode = result[0].currencyCode;
    })
}
$$(document).on("click",".no-gutter-big",  function(e) {
    mainView.router.load({pageName: 'show-details-order-page'});
    var orderObj = JSON.parse($$(this).attr("orderObj"));
    var socket = deviceReady.returnSocket();
    var orderId = $$(this).attr("id");
    var location = $$(this).attr("location");
    var status = $$(this).attr("status");
    var paidFor = $$(this).attr("paidFor");
    var total = $$(this).attr("total");
    var deliverer = $$(this).attr("deliverer");
    $$(".display-order-details-ul").html("");
    $$(".waiting-order-div").hide();
    $$(".order-card").show();
    $$(".now-serving-header").text("ORDER "+orderId+" FROM "+location);
    $$(".show-total-amount").text(currencyCode+' '+parseFloat(total).toFixed(2));
    if (status=='COLLECTED' && paidFor=="PAID") {
        var actionBtn = "<i class='material-icons color-teal'>check_circle</i>";
        $$(".action-btn").html(actionBtn).removeClass("open-popover");
    }else{
        var actionBtn = "<i class='material-icons color-teal'>menu</i>";
        $$(".action-btn").html(actionBtn).attr("location",location).attr("status",status).attr("paidFor",paidFor).attr("id",orderId).attr("deliverer",deliverer).addClass("open-popover");
    }
    for (var i = 0; i < orderObj.length; i++){
        var itemId = orderObj[i].id;
        var quantity = orderObj[i].quantity;
        var itemName = orderObj[i].itemName;
        var itemPrice = orderObj[i].totalPrice;
        var itemIcon = decodeURIComponent(orderObj[i].itemIcon);
        if(itemIcon==''){
            var itemIconDiv = "<i class='material-icons color-teal' style='font-size:80px;'>spa</i>";
        }else{
            var itemIconDiv = "<img src='"+serverUrl+itemIcon+"' style='max-width:100%;' class='itemIcon1'>"
        }
        if($(".rm-second-col-order").length!=0){
            $$(".rm-second-col-order").html("<div class='card' style='border-radius:20px;box-shadow:none;'><div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center>"+itemIconDiv+"</center></div><div class='card-footer' style='font-size:9px;font-weight:bold;'>"+quantity+" * "+itemPrice+" = "+(parseFloat(quantity) * parseFloat(itemPrice)).toFixed(2)+"</div></div>");
            $$(".second-col-order").removeClass("rm-second-col-order");
        }else{
            $$(".display-order-details-ul").append("<div class='row'> <div class='col-50'>   <div class='card' style='border-radius:20px;box-shadow:none;'> <div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center>"+itemIconDiv+"</center></div><div class='card-footer' style='font-size:9px;font-weight:bold;'>"+quantity+" * "+itemPrice+" = "+(parseFloat(quantity) * parseFloat(itemPrice)).toFixed(2)+"</div></div>  </div>  <div class='col-50 second-col-order rm-second-col-order'></div> </div>");
        }
    }

});
$$(document).on("click",".action-btn",  function(e) {
    var id = $$(this).attr("id");
    var location = $$(this).attr("location");
    var status = $$(this).attr("status");
    var paidFor = $$(this).attr("paidFor");
    var deliverer = $$(this).attr("deliverer");
    $$(".order-option-ul li a").attr("id",id).attr("status",status).attr("paidFor",paidFor).attr("deliverer",deliverer);
});
$$(document).on("click",".order-option-ul li a",  function(e) {
    var id = $$(this).attr("id");
    var status = $$(this).attr("status");
    var action = $$(this).attr("title");
    var paidFor = $$(this).attr("paidFor");
    var deliverer = $$(this).attr("deliverer");
    if (action=="MARK AS READY") {
        if (status=="READY") {
            showToast("Ooh!, this order has been marked as ready already!");
        }else{
            updateOrder(id,'READY','status','Order '+id+' will be marked as ready?',deliverer)
        }
    }else if (action=="MARK AS PAID"){
        if (paidFor=="PAID") {
            showToast("Ooh!, this order has been marked as paid already!");
        }else{
            updateOrder(id,'PAID','paidFor','Order '+id+' will be marked as paid?',deliverer)
        }
    }else if (action=="MARK AS DELIVERED"){
        if (status=="COLLECTED") {
            showToast("Ooh!, this order has been marked as delivered already!");
        }else{
            updateOrder(id,'COLLECTED','status','Order '+id+' will be marked as delivered?',deliverer)
        }
    }
});
function updateOrder(id,status,column,text,deliverer){
    if (column=='status') {
        if(userLogged=='shop'){
            selectDeliverer(id,status,column,text);
        }else{
            changeOrderStatus(id,status,column,text,deliverer);
        }
    }else{
        changeOrderStatus(id,status,column,text,deliverer);
    }
}
function selectDeliverer(id,status,column,text){
    myApp.actions([
       [
           {
               text: 'SMARTSTORE DELIVERERS',
               onClick: function () {
                  changeOrderStatus(id,status,column,text,'SMARTSTORE');
               }
           },{
               text: 'OUR OWN DELIVERERS',
               onClick: function () {
                  changeOrderStatus(id,status,column,text,'OUR OWN');
               }
           }
       ]
    ]);
}
function changeOrderStatus(id,status,column,text,deliverer){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm(text,function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('changeOrderStatus',id,column,status,deliverer,function(cb){
                if (cb) {
                    showToast("Order "+id+" has been marked as "+status.toLowerCase()+"!");
                    getOrders();
                }else{
                    showToast("Sorry we could not update this order!");
                }
                stopProcess();
            });
            processStatus(10000);
        }
    },'CONFIRM UPDATE',['Confirm','Cancel']);
}
$$(document).on("click",".nearby-stores-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    if(phoneNo!=null){
        mainView.router.load({pageName: 'pawnOrSell-nearby-page'});
        $$(".hide-on-agents").show();
        $$(".local-store-agents").text("LOCAL STORES");
        $$(".pawn-sell-nearby-ul").html("");
        getGPS(function(latitude,longitude){
            socket.emit("getLocalStores",latitude,longitude,function(result){
                stopProcess();
                displayLocalStores(result);
            });
        });
        processStatus(15000);
    }else{
        changeNumber();
    }
});
$$(document).on("change",".get-shops-by-category-select",  function(e) {
    var socket = deviceReady.returnSocket();
    var category = $$(this).val();
    $$(".pawn-sell-nearby-ul").html("");
    getGPS(function(latitude,longitude){
        socket.emit("getLocalStoresByCategory",latitude,longitude,category,function(result){
            stopProcess();
            displayLocalStores(result);
        });
    });
    processStatus(30000);
});
function displayLocalStores(result){
    if (result.length>0) {
        for (var i = 0; i < result.length; i++){
            var shopName=result[i].shopName;
            var shopId=result[i].shopId;
            var lati=result[i].latitude;
            var longi=result[i].longitude;
            var staffPhone=result[i].staffPhone;
            $$(".pawn-sell-nearby-ul").prepend("<li><div class='item-content'><div class='item-inner'><div class='item-title'>"+shopName+"</div><div class='item-after'><a href='#' class='button go-to-shop-panel-btn' shopId='"+shopId+"'><i class='material-icons color-purple'>shopping_basket</i></a><a href='#' class='button getLocationBtn' latitude='"+lati+"' longitude='"+longi+"' shopName='"+shopName+"'><i class='material-icons color-teal'>location_on</i></a></div></div></div></li>");
        }
    }
}
$$(document).on("click",".go-to-shop-panel-btn",  function(e) {
    var shopId = $$(this).attr("shopId");
    selfLogin(shopId,'normal');
});
function selfLogin(shopId,status){
    var socket = deviceReady.returnSocket();
    socket.emit('getShopDetails', shopId,function(cb,shopName,shopDes,activationDate,months,p,currency_code,remoteOrdering,shopLatitude,shopLongitude,workingHours,smartdriver){
        if(cb!=0){
            currentShopId = shopId;
            currentShopName = shopName;
            shopDescription = shopDes;
            smartDriver = smartdriver;
            checkActiveStatus(activationDate,months,p);
            $$(".shopNameShow").text(shopName.toUpperCase());
            currencyCode = currency_code;
            itemListArray=[];totalCost=0;totalBuying=0;totalWeight=0;$$(".total-cost-div,.all-total-cost-div,.after-items-price,.after-delivery-fee,.after-service-fee").text(currencyCode+"0.00");$$(".item-card-show").remove();
            distanceFromStore = getDistance(currentLatitude,currentLongitude,shopLatitude,shopLongitude).toFixed(1);
            remotePurchase = remoteOrdering;
            $$(".moto-label-shop").text('welcome to '+shopName+', Please enjoy your shopping');
            if(status=='normal'){
                mainView.router.load({pageName: 'main-page'});
            }else{
                $(".pick-item-btn").click();
                displayItemsByCategory("SPECIALS");
            }
            loggedIn=true;
            getActivationDate();
            $$(".shop-account-ul-btn").show();
            $$(".shop-account-btn").text("ACCOUNT BAL").attr("shopName",shopName);
            isStoreOpen(workingHours);
        }else{
            showToast('The shop ID you have entered does not exist!');
        }
        stopProcess();
    });
    processStatus(10000);
}
$$(document).on("click",".store-closed-btn",  function(e) {
    navigator.notification.alert($$(this).attr("title"),null,'OPEN STATUS','OK');
});
function getDistance(lat1, lon1, lat2, lon2){
  var R = 6371;
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}
function toRad(Value) {
  return Value * Math.PI / 180;
}
$$(document).on("click",".shop-account-btn",  function(e) {
    mainView.router.load({pageName: 'shop-account-balance-page'});
    getAccountBalance();
});
function getAccountBalance(){
    var socket = deviceReady.returnSocket();
    $$(".savings-account-name-div").text("ACCOUNT BALANCE");
    socket.emit("getThisShopAccountBalance",phoneNo,currentShopId,function(result){
        if(result.length>0){
            $$(".show-my-account-bal-div").html(currencyCode+" "+parseFloat(result[0].balance).toFixed(2));
            accountBal = parseFloat(result[0].balance).toFixed(2);
        }else{
            $$(".show-my-account-bal-div").html(currencyCode+" 0.00");
            accountBal = 0;
        }
    });
}
$$(document).on("click",".topup-account-bal-btn",  function(e) {
    navigator.notification.prompt('You will be able to purchase anything using the deposited amount in this store!',function(results){
        var amount=results.input1;
        if(results.buttonIndex==1){
            if(amount!=""){
                scanCard('',0,0,'loadAccount',amount);
            }
        }
    },'LOAD ACCOUNT ('+currencyCode+')',['PROCEED','CANCEL']);
});
$$(document).on("click",".go-back-btn",  function(e) {
    navigator.app.backHistory();
});
$$(document).on("click",".add-pawnOrSell-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    var itemName = $$(".pawn-sell-item-name").val();
    var itemDec = $$(".pawn-sell-item-description").val();
    var expectedCash = $$(".pawn-sell-expected-cash").val();
    var category = $$(".select-insert-category-input").val();
    var itemIcon = $$(".media-preview-image").attr("uploadSrc");
    var date = Date.now();
    var pawnOrSell = $$(this).attr("title");
    var itemUrl = "files/items/"+phoneNo+""+date+".png"
    if(itemName!="" && itemDec!="" && expectedCash!="" && category!='SELECT CATEGORY'){
        if(itemIcon!=""){
            getGPS(function(latitude,longitude){
                uploadFile(itemIcon,itemUrl,"image/png",function(response){
                    if(response=='success'){
                        socket.emit('addPawnSell', itemName,itemDec,expectedCash,itemUrl,latitude,longitude,date,pawnOrSell,phoneNo,category,function(cb){
                            stopProcess();
                            if(cb){
                                pawnOrSellFn(pawnOrSell);
                                navigator.notification.alert('You can now wait for bids or visit a nearest store!',null,'ITEM PLACED FOR '+pawnOrSell+"ING",'Done');
                                $$(".pawn-sell-item-name,.pawn-sell-item-description,.pawn-sell-expected-cash").val("");
                                $$(".media-preview-image").attr("uploadSrc","");
                            }else{
                                showToast('There was an error while trying to '+pawnOrSell.toLowerCase()+' your item!');
                            }
                        });
                    }
                });
            });
            processStatus(60000);
        }else{
            showToast("Please select an image to proceed!");
        }
    }else{
        showToast("All fields are mandatory!");
    }
});
function pawnOrSellFn(pawnOrSell){
    var socket = deviceReady.returnSocket();
    $$(".pawnOrSell-div-toggle").show();
    mainView.router.load({pageName: 'pawnOrSell-page'});
    $$(".pawnOrSell-div").text('YOUR '+pawnOrSell+' LIST');
    $$(".add-pawnOrSell-div").text(pawnOrSell+' YOUR ITEM');
    $$(".add-pawnOrSell-btn").attr("title",pawnOrSell);
    $$(".pawn-sell-list-ul").html("");
    $$(document).on("change",".select-get-category-input", function(e){
        $$(".pawn-sell-list-ul").html("");
        var category = $$(this).val();
        socket.emit('getPawnSell',phoneNo,pawnOrSell,category,function(result){
            if(result.length>0){
                for (var i = 0; i < result.length; i++){
                    (function(x){
                        setTimeout(function () {
                            var itemName=result[x].itemName;
                            var itemDesc=result[x].itemDec;
                            var itemIcon=result[x].itemIcon;
                            itemIcon = serverUrl+itemIcon;
                            var expectedCash=result[x].expectedCash;
                            var status=result[x].status;
                            var id=result[x].id;
                            var date=result[x].date;
                            var itemOwner=result[x].itemOwner;
                            //$$(".pawn-sell-list-ul").prepend("<li itemOwner='"+itemOwner+"' uniqueLI='"+id+"' id='"+id+"' date='"+date+"' status='"+status+"' pawnOrSell='"+pawnOrSell+"' expectedCash='"+expectedCash+"' data-popover='.popover-pawnOrSell' class='open-popover pawnOrSell-option-btn' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemIcon='"+itemIcon+"'><a href='#' class='item-link item-content'><div class='item-media'><img src='"+itemIcon+"' style='width:50px;height:50px;'/></div><div class='item-inner'><div class='item-title-row'><div class='item-title'>"+itemName+"</div><div class='item-after'><i class='material-icons'>more_vert</i></div></div><div class='item-subtitle'><span class='bid-span' id='bid-span"+id+"'>"+status+"</span><span class='price-span' style='margin-left:20px;'>PRICE ("+parseFloat(expectedCash).toFixed(2)+")</span></div></div></a></li>");
                            if($(".rm-second-col").length!=0){
                                $$(".rm-second-col").html("<div class='card open-popover pawnOrSell-option-btn' style='border-radius:20px;box-shadow:none;' itemOwner='"+itemOwner+"' uniqueLI='"+id+"' id='"+id+"' date='"+date+"' status='"+status+"' pawnOrSell='"+pawnOrSell+"' expectedCash='"+expectedCash+"' data-popover='.popover-pawnOrSell' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemIcon='"+itemIcon+"'><div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center><img src='"+itemIcon+"' class='itemIcon1'></center></div><div class='card-footer'><a href='#' class='link' style='font-size:9px;'>"+parseFloat(expectedCash).toFixed(2)+"</a><a href='#' class='link' id='bid-span"+id+"' style='font-size:9px;'>"+status+"</a></div></div>");
                                $$(".second-col").removeClass("rm-second-col");
                            }else{
                                $$(".pawn-sell-list-ul").append("<div class='row'> <div class='col-50'><div class='card open-popover pawnOrSell-option-btn' style='border-radius:20px;box-shadow:none;' itemOwner='"+itemOwner+"' uniqueLI='"+id+"' id='"+id+"' date='"+date+"' status='"+status+"' pawnOrSell='"+pawnOrSell+"' expectedCash='"+expectedCash+"' data-popover='.popover-pawnOrSell' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemIcon='"+itemIcon+"'> <div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center><img src='"+itemIcon+"' class='itemIcon1'></center></div><div class='card-footer'><a href='#' class='link' style='font-size:9px;'>"+parseFloat(expectedCash).toFixed(2)+"</a><a href='#' class='link' id='bid-span"+id+"' style='font-size:9px;'>"+status+"</a></div></div></div>  <div class='col-50 second-col rm-second-col'></div>");
                            }
                            if(status=='RUNNING'){
                                getBids(id);
                            }
                        }, 500 * i);
                    })(i);
                }
            }
        })
    });
}
function shopPawnOrSellFn(pawnOrSell){
    var socket = deviceReady.returnSocket();
    mainView.router.load({pageName: 'pawnOrSell-page'});
    $$(".pawnOrSell-div-toggle").hide();
    $$(".pawnOrSell-div").text(pawnOrSell+' ITEMS');
    if(pawnOrSell=='BUY'){
        pawnOrSell='SELL';
    }else{
        pawnOrSell=pawnOrSell;
    }
    $$(".pawn-sell-list-ul").html("");
    $$(document).on("change",".select-get-category-input", function(e){
        $$(".pawn-sell-list-ul").html("");
        var category = $$(this).val();
        getGPS(function(latitude,longitude){
            socket.emit('getPawnBuy',latitude,longitude,pawnOrSell,radius,category,function(result){
                if(result.length>0){
                    for (var i = 0; i < result.length; i++){
                        (function(x){
                            setTimeout(function () {
                                var itemName=result[x].itemName;
                                var itemDesc=result[x].itemDec;
                                var itemIcon=result[x].itemIcon;
                                itemIcon = serverUrl+itemIcon;
                                var expectedCash=result[x].expectedCash;
                                var status=result[x].status;
                                var id=result[x].id;
                                var date=result[x].date;
                                var itemOwner=result[x].itemOwner;
                                //$$(".pawn-sell-list-ul").prepend("<li itemOwner='"+itemOwner+"' uniqueLI='"+id+"' id='"+id+"' date='"+date+"' status='"+status+"' pawnOrSell='"+pawnOrSell+"' expectedCash='"+expectedCash+"' data-popover='.popover-shopPawnOrSell' class='open-popover pawnOrSell-option-btn' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemIcon='"+itemIcon+"'><a href='#' class='item-link item-content'><div class='item-media'><img src='"+itemIcon+"' style='width:50px;height:50px;'/></div><div class='item-inner'><div class='item-title-row'><div class='item-title'>"+itemName+"</div><div class='item-after'><i class='material-icons'>more_vert</i></div></div><div class='item-subtitle'><span class='bid-span' id='bid-span"+id+"'>"+status+"</span><span class='price-span' style='margin-left:20px;'>PRICE ("+parseFloat(expectedCash).toFixed(2)+")</span></div></div></a></li>");
                                if($(".rm-second-col").length!=0){
                                    $$(".rm-second-col").html("<div class='card open-popover pawnOrSell-option-btn' style='border-radius:20px;box-shadow:none;' itemOwner='"+itemOwner+"' uniqueLI='"+id+"' id='"+id+"' date='"+date+"' status='"+status+"' pawnOrSell='"+pawnOrSell+"' expectedCash='"+expectedCash+"' data-popover='.popover-shopPawnOrSell' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemIcon='"+itemIcon+"'><div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center><img src='"+itemIcon+"' class='itemIcon1'></center></div><div class='card-footer'><a href='#' class='link' style='font-size:9px;'>"+parseFloat(expectedCash).toFixed(2)+"</a><a href='#' class='link' id='bid-span"+id+"' style='font-size:9px;'>"+status+"</a></div></div>");
                                    $$(".second-col").removeClass("rm-second-col");
                                }else{
                                    $$(".pawn-sell-list-ul").append("<div class='row'> <div class='col-50'><div class='card open-popover pawnOrSell-option-btn' style='border-radius:20px;box-shadow:none;' itemOwner='"+itemOwner+"' uniqueLI='"+id+"' id='"+id+"' date='"+date+"' status='"+status+"' pawnOrSell='"+pawnOrSell+"' expectedCash='"+expectedCash+"' data-popover='.popover-shopPawnOrSell' itemName='"+itemName+"' itemDesc='"+itemDesc+"' itemIcon='"+itemIcon+"'> <div class='card-header' style='color:#757575;font-weight:bold;font-size:10px;'>"+itemName.toUpperCase()+"</div><div class='card-content card-content-img1'><center><img src='"+itemIcon+"' class='itemIcon1'></center></div><div class='card-footer'><a href='#' class='link' style='font-size:9px;'>"+parseFloat(expectedCash).toFixed(2)+"</a><a href='#' class='link' id='bid-span"+id+"' style='font-size:9px;'>"+status+"</a></div></div></div>  <div class='col-50 second-col rm-second-col'></div>");
                                }
                                getBids(id);
                            }, 500 * i);
                        })(i);
                    }
                }
            })
        });
    });
}
function getBids(id){
    var socket = deviceReady.returnSocket();
    socket.emit('getBids',id,function(result){
        if(result.length>0){
            $$("[id='bid-span"+id+"']").html("BIDS ("+result.length+")");
            $$("[uniqueLI='"+id+"']").attr('result',result);
        }
    });
}
$$(document).on("click",".pawnOrSell-option-btn",  function(e) {
    var itemName = $$(this).attr("itemName");
    var expectedCash = $$(this).attr("expectedCash");
    var itemDesc = $$(this).attr("itemDesc");
    var itemIcon = $$(this).attr("itemIcon");
    var id = $$(this).attr("id");
    var date = $$(this).attr("date");
    var status = $$(this).attr("status");
    var pawnOrSell = $$(this).attr("pawnOrSell");
    var result = $$(this).attr("result");
    var itemOwner = $$(this).attr("itemOwner");
    $$(".popover-pawnOrSell-ul li a").attr("itemName",itemName).attr("expectedCash",expectedCash).attr("itemDesc",itemDesc).attr("itemIcon",itemIcon).attr("id",id).attr("date",date).attr("status",status).attr("pawnOrSell",pawnOrSell).attr("itemOwner",result).attr("itemOwner",itemOwner);

});
$$(document).on("click",".popover-pawnOrSell-ul li a",  function(e) {
    var itemName = $$(this).attr("itemName");
    var expectedCash = $$(this).attr("expectedCash");
    var itemDesc = $$(this).attr("itemDesc");
    var itemIcon = $$(this).attr("itemIcon");
    var id = $$(this).attr("id");
    var date = $$(this).attr("date");
    var status = $$(this).attr("status");
    var pawnOrSell = $$(this).attr("pawnOrSell");
    var action = $$(this).attr("title");
    var itemOwner = $$(this).attr("itemOwner");
    if(action=='pawnOrSell-details-btn'){
        viewPawnSellDetails(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell);
    }else if(action=='pawnOrSell-nearby-btn'){
        getNearByAgents(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell);
    }else if(action=='pawnOrSell-terminate-btn'){
        terminatePawnSell(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell);
    }else if(action=='pawnOrSell-bids-btn'){
         viewBids(id,itemName,expectedCash,pawnOrSell);
    }else if(action=='pawnOrSell-place-bid-btn'){
        placeBid(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell);
    }else if(action=='pawnOrSell-call-btn'){
        window.location = 'tel:'+itemOwner;
    }
});
function placeBid(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell){
    mainView.router.load({pageName: 'pawn-sell-place-bid-page'});
    $$(".place-bid-item-name").text(itemName.toUpperCase());
    $$(".bid-offer-input").val(expectedCash);
    $$(".place-bid-btn").attr("id",id).attr("pawnOrSell",pawnOrSell)
    if(pawnOrSell=='PAWN'){
        $$(".bid-interest-li").show();
    }else{
        $$(".bid-interest-li").hide();
    }
    $$(".place-bid-item-expected-cash").text(parseFloat(expectedCash).toFixed(2));
}
$$(document).on("click",".place-bid-btn",  function(e) {
    var id = $$(this).attr("id");
    var pawnOrSell = $$(this).attr("pawnOrSell");
    var offers = $$(".bid-offer-input").val();
    var interest = $$(".bid-interest-input").val();
    var toPay = (((parseFloat(interest) / 100) * parseFloat(offers)) + parseFloat(offers)).toFixed(2);
    if(pawnOrSell=='PAWN'){
        if(offers!="" && interest!=""){
            navigator.notification.confirm('Your interest is '+interest+'%. The item owner will have to pay you '+toPay+' to reclaim the item!',function(buttonIndex){
                if(buttonIndex==1){
                    placeBidNow(id,offers,interest,toPay);
                }
            },'YOU OFFER IS '+parseFloat(offers).toFixed(2),['Proceed','Cancel']);
        }else{
            showToast("All fields are supposed to be filled!");
        }
    }else{
        if(offers!=""){
            navigator.notification.confirm('Press proceed to place your bid!',function(buttonIndex){
                if(buttonIndex==1){
                    placeBidNow(id,offers,0,0);
                }
            },'YOU OFFER IS '+parseFloat(offers).toFixed(2),['Proceed','Cancel']);
        }else{
            showToast("Please include your offer!");
        }
    }
});
function placeBidNow(itemId,offers,interest,toPay){
    var socket = deviceReady.returnSocket();
    getGPS(function(latitude,longitude){
        socket.emit('placeBid',itemId,offers,interest,latitude,longitude,currentShopId,function(cb){
            stopProcess();
            if(cb==true){
                showToast("Your bid has been placed!, You can now wait for a response from the item owner!");
                navigator.app.backHistory();
            }else{
                showToast('Error while trying to place your bid!');
            }
        });
    });
    processStatus(20000);
}
function viewBids(id,itemName,expectedCash,pawnOrSell){
    var socket = deviceReady.returnSocket();
    mainView.router.load({pageName: 'pawn-sell-bids-page'});
    $$(".pawnOrSell-bid-div").text(itemName.toUpperCase()+" ("+parseFloat(expectedCash).toFixed(2)+")");
    $$(".pawn-sell-bids-list-ul").html("");
    socket.emit('getBids',id,function(result){
        if(result.length>0){
            $$("[id='bid-span"+id+"']").html("BIDS ("+result.length+")");
            for (var i = 0; i < result.length; i++){
                var shopName=result[i].shopName;
                var staffPhone=result[i].staffPhone;
                var shopId=result[i].shopId;
                var offers=result[i].offers;
                var interest=result[i].interest;
                var latitude=result[i].latitude;
                var longitude=result[i].longitude;
                var toPay = (((parseFloat(interest) / 100) * parseFloat(offers)) + parseFloat(offers)).toFixed(2);
                if(pawnOrSell=='PAWN'){
                    $$(".pawn-sell-bids-list-ul").prepend("<li pawnOrSell='"+pawnOrSell+"' id='"+id+"' staffPhone='"+staffPhone+"' interest='"+interest+"' shopName='"+shopName+"' shopId='"+shopId+"' latitude='"+latitude+"' longitude='"+longitude+"' toPay='"+toPay+"' offers='"+offers+"' data-popover='.popover-bid-pawnOrSell' class='open-popover pawnOrSell-bid-option-btn'><a href='#' class='item-link item-content'><div class='item-media'><i class='material-icons color-teal'>business</i></div><div class='item-inner'><div class='item-title-row'><div class='item-title' style='font-size:12px;'>"+shopName+"</div><div class='item-after'>"+toPay+"</div></div><div class='item-subtitle'><span class='bid-span'>INTEREST ("+interest+"%)</span><span class='price-span' style='margin-left:20px;'>OFFERS ("+parseFloat(offers).toFixed(2)+")</span></div></div></a></li>");
                }else{
                    $$(".pawn-sell-bids-list-ul").prepend("<li pawnOrSell='"+pawnOrSell+"' id='"+id+"' staffPhone='"+staffPhone+"' interest='"+interest+"' shopName='"+shopName+"' shopId='"+shopId+"' latitude='"+latitude+"' longitude='"+longitude+"' toPay='"+toPay+"' offers='"+offers+"' data-popover='.popover-bid-pawnOrSell' class='open-popover pawnOrSell-bid-option-btn'><a href='#' class='item-link item-content'><div class='item-media'><i class='material-icons color-teal'>business</i></div><div class='item-inner'><div class='item-title-row'><div class='item-title' style='font-size:12px;'>"+shopName+"</div><div class='item-after'>OFFERS "+parseFloat(offers).toFixed(2)+"</div></div></div></a></li>");
                }
            }
        }
    });
}
$$(document).on("click",".pawnOrSell-bid-option-btn",  function(e) {
    var shopName = $$(this).attr("shopName");
    var shopId = $$(this).attr("shopId");
    var offers = $$(this).attr("offers");
    var interest = $$(this).attr("interest");
    var id = $$(this).attr("id");
    var latitude = $$(this).attr("latitude");
    var longitude = $$(this).attr("longitude");
    var toPay = $$(this).attr("toPay");
    var staffPhone = $$(this).attr("staffPhone");
    var pawnOrSell = $$(this).attr("pawnOrSell");
    $$(".popover-bid-pawnOrSell-ul li a").attr("shopName",shopName).attr("staffPhone",staffPhone).attr("shopId",shopId).attr("offers",offers).attr("interest",interest).attr("id",id).attr("latitude",latitude).attr("longitude",longitude).attr("toPay",toPay).attr("pawnOrSell",pawnOrSell);
});
$$(document).on("click",".popover-bid-pawnOrSell-ul li a",  function(e) {
    var shopName = $$(this).attr("shopName");
    var shopId = $$(this).attr("shopId");
    var offers = $$(this).attr("offers");
    var interest = $$(this).attr("interest");
    var id = $$(this).attr("id");
    var latitude = $$(this).attr("latitude");
    var longitude = $$(this).attr("longitude");
    var toPay = $$(this).attr("toPay");
    var staffPhone = $$(this).attr("staffPhone");
    var action = $$(this).attr("title");
    var pawnOrSell = $$(this).attr("pawnOrSell");
    if(action=="pawnOrSell-accept-bid-btn"){
        acceptBid(shopId,offers,interest,id,toPay,pawnOrSell);
    }else if(action=="pawnOrSell-visit-agent-btn"){
        getDirection(latitude,longitude,shopName);
    }else if(action=="pawnOrSell-call-agent-btn"){
        window.location = 'tel:'+staffPhone;
    }
});
function getDirection(latitude,longitude,label){
    //var label = encodeURI(label);
    var geocoords = parseFloat(latitude) + ',' + parseFloat(longitude);
    window.open('geo:0,0?q=' + geocoords + '(' + label + ')', '_system');
}
function acceptBid(shopId,acceptedOffer,interest,id,toPay,pawnOrSell){
    var socket = deviceReady.returnSocket();
    if(pawnOrSell='PAWN'){
        var alertMsg =  'You will be offered '+parseFloat(acceptedOffer).toFixed(2)+' Then pay '+parseFloat(toPay).toFixed(2)+' after 30 days to reclaim your item!'
    }else{
        var alertMsg = 'Click accept button to accept an offer of '+parseFloat(acceptedOffer).toFixed(2);
    }
    navigator.notification.confirm(alertMsg,function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('acceptBid',shopId,acceptedOffer,id,toPay,function(cb){
                stopProcess();
                if(cb==true){
                    showToast("Bid has been accepted!");
                }else{
                    showToast("There was an error, while trying to accept bid!");
                }
            });
            processStatus(10000);
        }
    },'ACCEPT BID ?',['Accept','Cancel']);
}
function terminatePawnSell(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm('Your item will be removed from the list',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('terminatePawnSell',id,function(cb){
                stopProcess();
                if(cb){
                    showToast("Your item has been deleted");
                    $$("[uniqueLI='"+id+"']").remove();
                }else{
                    showToast("There was an error, while trying to delete your item!");
                }
            });
            processStatus(10000);
        }
    },'TERMINATE YOUR '+pawnOrSell+'?',['Terminate','Cancel']);
}
function getNearByAgents(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell){
    var socket = deviceReady.returnSocket();
    $$(".hide-on-agents").hide();
    mainView.router.load({pageName: 'pawnOrSell-nearby-page'});
    $$(".local-store-agents").text("LOCAL AGENCIES");
    $$(".pawn-sell-nearby-ul").html("");
    getGPS(function(latitude,longitude){
        socket.emit("getNearByAgents",latitude,longitude,function(result){
            stopProcess();
            if (result.length>0) {
                for (var i = 0; i < result.length; i++){
                    var shopName=result[i].shopName;
                    var lati=result[i].latitude;
                    var longi=result[i].longitude;
                    var staffPhone=result[i].staffPhone;
                    $$(".pawn-sell-nearby-ul").prepend("<li><div class='item-content'><div class='item-inner'><div class='item-title'>"+shopName+"</div><div class='item-after'><a href='#' class='button call-agent-btn' phone='"+staffPhone+"'><i class='material-icons'>phone</i></a><a href='#' class='button getLocationBtn' latitude='"+lati+"' longitude='"+longi+"' shopName='"+shopName+"'><i class='material-icons'>location_on</i></a></div></div></div></li>");
                }
            }
        });
    });
    processStatus(30000);
}
$$(document).on("click",".call-agent-btn",  function(e) {
    var phone = $$(this).attr("phone");
    window.location = 'tel:'+phone;
});
function viewPawnSellDetails(itemName,expectedCash,itemDesc,itemIcon,id,date,status,pawnOrSell){
    mainView.router.load({pageName: 'pawnOrSell-details-page'});
    $$(".pawnOrSell-item-div").text(itemName.toUpperCase()+' DETAILS');
    $$(".show-pawnSellDetails-div").html("<div class='card'><div class='card-header' style='font-weight:bold;color:#757575;'>"+itemName.toUpperCase()+"</div><div class='card-content'><center><img src="+itemIcon+" class='itemIcon1' style='max-width:98%;border-radius:3px;'></center></div><div class='card-content list-block'><ul> <li><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>lens</i></div><div class='item-inner'><div class='item-title'>STATUS</div><div class='item-after'>"+status+"</div></div></div></li><li><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>lens</i></div><div class='item-inner'><div class='item-title'>EXPECTED CASH</div><div class='item-after'>"+parseFloat(expectedCash).toFixed(2)+"</div></div></div></li> </ul></div><div class='card-content'><div class='card-content-inner'>"+itemDesc+"</div></div></div>");
}
$$(document).on("click",".browse-icon-btn",  function(e) {
    navigator.notification.confirm('You can choose from Camera or Gallery or Remove photo',function(buttonIndex){
        if(buttonIndex==1){
            openGallery();
        }else if(buttonIndex==2){
            openCamera();
        }
    },'CHOOSE FROM',['Gallery','Camera']);
});
function openGallery(){
   navigator.camera.getPicture(onSuccess, null, { quality: 100,
      destinationType: Camera.DestinationType.FILE_URL,
      sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
      mediaType:Camera.MediaType.ALLMEDIA,
      allowEdit: true,
        targetWidth:800,
        targetHeight:800
   });
   function onSuccess(fileUri) {
     fileUri = 'file://' + fileUri;
     plugins.crop(function success (path) {
          $(".media-preview-image").attr("src", window.Ionic.WebView.convertFileSrc(path)).attr('uploadSrc',path);
          mainView.router.load({pageName: 'media-preview-page'});
      }, function fail () {

      }, fileUri, { quality: 100 })
   }
}
function openCamera(){
    navigator.camera.getPicture(onSuccess, null, {
      quality: 50,
      destinationType: Camera.DestinationType.FILE_URL
    });
    function onSuccess(fileUri) {
        plugins.crop(function success (path) {
            $(".media-preview-image").attr("src",window.Ionic.WebView.convertFileSrc(path)).attr('uploadSrc',path);
            mainView.router.load({pageName: 'media-preview-page'});
        }, function fail () {

        }, fileUri, { quality: 100 })
    }
}
$$(document).on("click",".pay-go-to-card-details-btn", function(e){
    if(userLogged=='customer'){
        selectPurchaseLocation('smartStore');
    }else{
        finishPayments('local','smartStore');
    }
});
$$(document).on("click",".finish-order-btn",  function(e) {
    if(userLogged=='customer'){
        selectPurchaseLocation('smartRestaurant');
    }else{
        finishPayments('local','smartRestaurant');
    }
});
function selectPurchaseLocation(option){
    if(openStatus==true){
        myApp.actions([
           [
               {
                   text: 'SELF-CHECKOUT',
                   onClick: function () {
                      finishPayments('local',option);
                   }
               },{
                   text: 'REMOTE PURCHASE',
                   onClick: function () {
                      if(remotePurchase=='TRUE'){
                          finishPayments('remote',option);
                      }else{
                          showToast("This store does not allow remote ordering!")
                      }
                   }
               }
           ]
        ]);
    }else{
        showToast("This store is currently closed, please try again later!");
    }
}
function finishPayments(location,option){
    getAccountBalance();
    if(location=='remote'){
        var service_fee = serviceFee * 4;
        var delivery_fee = (parseFloat(serviceFee) * 4) * 3;
        var chargesPerKm = serviceFee;
        if(smartDriver=='TRUE'){
            if(distanceFromStore < 8){
                delivery_fee = delivery_fee;
            }else if(distanceFromStore>=8){
                var distanceTobeAdded = distanceFromStore - 7;
                delivery_fee = delivery_fee + (distanceTobeAdded * chargesPerKm);
            }
        }else{
            var delivery_fee = 0;
        }
    }else{
        var service_fee = serviceFee * 2;
        var delivery_fee = 0;
    }
    deliveryFee = delivery_fee * 0.85;
    service_fee = service_fee + (deliveryFee * 0.15);
    $$(".after-items-price").text(currencyCode+' '+totalCost.toFixed(2));
    $$(".after-delivery-fee").text(currencyCode+' '+deliveryFee.toFixed(2));
    $$(".after-service-fee").text(currencyCode+' '+service_fee.toFixed(2));
    var allTotal = (totalCost + service_fee + deliveryFee).toFixed(2);
    $$(".all-total-cost-div").text(currencyCode+' '+allTotal);
    if(location=='remote'){
        $$(".payment-note-div").html("<center>YOU PAY "+currencyCode+" "+(service_fee+totalCost).toFixed(2)+" NOW AND THEN PAY "+currencyCode+" "+deliveryFee.toFixed(2)+" IN CASH TO THE DRIVER AFTER RECEIVING YOUR ORDER</center>");
    }else{
        $$(".payment-note-div").html("");
    }
    if(location=='local' && option=='smartRestaurant'){
        navigator.notification.prompt('Enter table number for easy identification',function(results){
            var tableNo=results.input1;
            if(results.buttonIndex==1){
                if(tableNo!=""){
                    $$(".payment-ul li").attr("location",tableNo).attr("latitude",0).attr("longitude",0).attr("option",option).attr("deliveryFee",deliveryFee);
                    $$(".cash-payment-btn,.pay-later-btn").show();
                }
            }
        },'ENTER TABLE NUMBER',['PROCEED','CANCEL']);
    }else if(location=='remote' && option=='smartRestaurant'){
        getGPS(function(latitude,longitude){
            $$(".payment-ul li").attr("location",location).attr("latitude",latitude).attr("longitude",longitude).attr("option",option).attr("deliveryFee",deliveryFee);
        });
        $$(".cash-payment-btn,.pay-later-btn").hide();
    }else if(location=='local' && option=='smartStore'){
        $$(".payment-ul li").attr("location",location).attr("latitude",0).attr("longitude",0).attr("option",option).attr("deliveryFee",deliveryFee);
        $$(".pay-later-btn").hide();
        $$(".cash-payment-btn").show();
    }else if(location=='remote' && option=='smartStore'){
        getGPS(function(latitude,longitude){
            $$(".payment-ul li").attr("location",location).attr("latitude",latitude).attr("longitude",longitude).attr("option",option).attr("deliveryFee",deliveryFee);
        });
        $$(".cash-payment-btn,.pay-later-btn").hide();
    }
    //mainView.router.load({pageName: 'payment-method-page'});
    mainView.router.load({pageName: 'total-payment-details-page'});
}
$$(document).on("click",".payment-ul li",  function(e) {
    var location = $$(this).attr("location");
    var latitude = $$(this).attr("latitude");
    var longitude = $$(this).attr("longitude");
    var option = $$(this).attr("option");
    var action = $$(this).attr("title");
    if(location=='remote'){
        var service_fee = serviceFee * 4;
    }else{
        var service_fee = serviceFee * 2;
    }
    service_fee = service_fee + (deliveryFee * 0.15);
    var amount = (parseFloat(service_fee) + parseFloat(totalCost)).toFixed(2);
    if(action=="card-payment-btn"){
        if(accountActive==true){
            scanCard(location,latitude,longitude,option,'CC');
        }else{
            accountIsSuspended();
        }
    }else if(action=="cash-payment-btn"){
        if(userLogged!='customer'){
            navigator.notification.prompt('Lets calculate the change. Enter amount received',function(results){
                var totalCash=results.input1;
                var change = parseFloat(totalCash) - amount;
                if(results.buttonIndex==1){
                    if(change>-1){
                        navigator.notification.alert(currencyCode+' '+change.toFixed(2),function(){},'CHANGE DUE','ok');
                        processPayment('',amount,'','',location,latitude,longitude,option,'CA');
                        processStatus(10000);
                    }else{
                        showToast("The amount received is lower than items cost!");
                    }
                }
            },'TOTAL '+currencyCode+' '+amount,['PROCEED','CANCEL']);
        }else{
            navigator.notification.prompt('Please pay '+currencyCode+''+amount+' to the cashier on the till!',function(results){
                var CashierID=results.input1;
                if(results.buttonIndex==1){
                    if(CashierID!=''){
                        requestForCashier('',amount,'','',location,latitude,longitude,option,'CA',CashierID);
                        processStatus(60000)
                    }
                }
            },'ENTER TILL NUMBER',['PROCEED','CANCEL']);
        }
    }else if(action=="pay-later-btn"){
        processPayment('',amount,'','',location,latitude,longitude,option,'LT');
        processStatus(10000);
    }else if(action=="account-bal-btn"){
        if(accountBal>=totalCost){
            processPayment('',amount,'','',location,latitude,longitude,option,'AC');
            processStatus(10000);
        }else{
            showToast("You have insufficient balance to pay for your items!");
        }
    }else if(action=="paypal-btn"){
        if(paypalObj.length>0){
            var secretKey = paypalObj[0].secretKey;
            var publicKey = paypalObj[0].publicKey;
            payPalProcess(secretKey,publicKey,amount,location,latitude,longitude,option,'PP');
        }else{
            showToast("This payment method is available in this particular shop!");
        }
    }
});
function requestForCashier(paymentGateway,amount,tokenId,secretKey,location,latitude,longitude,option,paymentMethod,CashierID){
    var socket = deviceReady.returnSocket();
    var otherKey = paymentGatewayObj[0].otherKey;
    var itemListString = JSON.stringify(itemListArray);
    socket.emit('requestForCashier',CashierID,amount,tokenId,secretKey,currentShopId,itemListString,loggedInUser,totalBuying,formatted_date(new Date()),totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod);
}
function getQuantity(id){
    if (itemListArray.length>0) {
        for (var i = 0; i < itemListArray.length; i++){
            var itemId=itemListArray[i].id;
            var quantity=itemListArray[i].quantity;
            if (itemId==id) {
                return quantity;
            }else{
                return 0;
            }
        }
    }else{
        return 0;
    }
}
function getLocalItems(id,data,item){
    for (var i = 0; i < data.length; i++){
        var itemId=data[i].id;
        var url=data[i].itemIcon;
        var itemName=data[i].itemName;
        var itemPrice=data[i].itemSelling;
        var itemQuantity=data[i].itemQuantity;
        var itemDes=data[i].itemDes;
        var itemBuying=data[i].itemBuying;
        var itemWeight=data[i].itemWeight;
        if (itemId==id) {
            if (item=='itemName') {
                return itemName;
            }else if(item=='itemPrice'){
                return itemPrice;
            }else if (item=='itemIcon') {
                return url;
            }else if(item=='itemBuying'){
                return itemBuying;
            }else if(item=='itemWeight'){
                return itemWeight;
            }
        }
    }
}
var cardIOResponseFields = [
    "card_type",
    "card_number",
    "expiry_month",
    "expiry_year",
    "cvv"
];
function scanCard(location,latitude,longitude,option,paymentMethod){
    CardIO.canScan(function(canScan){
        if (canScan) {
            CardIO.scan({
              "requireExpiry": true,
              "scanExpiry": true,
              "requireCVV": true,
              "requirePostalCode": false,
              "restrictPostalCodeToNumericOnly": true,
              "hideCardIOLogo": true,
              "suppressScan": false,
              "keepApplicationTheme": true
            } , function(response){
                var cardNumber = response.cardNumber;
                var expiryMonth = response.expiryMonth;
                var expiryYear = response.expiryYear;
                var cvv = response.cvv;
                processCardPayment(cardNumber,expiryMonth,expiryYear,cvv,location,latitude,longitude,option,paymentMethod);
            }, function(){
                showToast("You cancelled card scan!");
            });
        }else{
            showToast("Scan method is not allowed!");
        }
    });
}
var printList = []; var printAmount=0; var receiptNo = 0;
function paymentSuccess(option,status){
    mainView.router.load({pageName: 'payment-success-page'});
    $$(".search-printer-devices-btn").hide();
    if(option=='smartRestaurant'){
        if(status!=false){
            var msg = 'Your order has been placed, Please wait while it is being prepared!';
            var minIcon =  "<i class='material-icons color-green' style='font-size:150px;'>check_circle</i>";
            printList = itemListArray; printAmount=totalCost; receiptNo = status;
            itemListArray=[];totalCost=0;totalBuying=0;totalWeight=0;$$(".total-cost-div,.all-total-cost-div,.after-items-price,.after-delivery-fee,.after-service-fee").text(currencyCode+"0.00");$$(".item-card-show").remove();
            if(userLogged=="shop"){
                $$(".search-printer-devices-btn").show();
            }
        }else{
            var msg = 'Could not place your order, Please make sure your payment method is valid!';
            var minIcon =  "<i class='material-icons color-tomato' style='font-size:150px;'>error_outline</i>";
        }
    }else if(option=='smartStore'){
        if(status!=false){
            printList = itemListArray; printAmount=totalCost; receiptNo = status;
            var msg = 'You have successfully paid for your items. Thank you';
            var minIcon =  "<i class='material-icons color-green' style='font-size:150px;'>check_circle</i>";
            itemListArray=[];totalCost=0;totalBuying=0;totalWeight=0;$$(".total-cost-div,.all-total-cost-div,.after-items-price,.after-delivery-fee,.after-service-fee").text(currencyCode+"0.00");$$(".item-card-show").remove();
            if(userLogged=="shop"){
                $$(".search-printer-devices-btn").show();
            }
        }else{
            var msg = 'Could not complete the payment, Your payment method has been denied';
            var minIcon =  "<i class='material-icons color-tomato' style='font-size:150px;'>error_outline</i>";
        }
    }
    else if(option=='subscription'){
        if(status==true){
            var msg = 'Your subscription was success. Happy business month!';
            var minIcon =  "<i class='material-icons color-green' style='font-size:150px;'>check_circle</i>";
            itemListArray=[];totalCost=0;totalBuying=0;totalWeight=0;$$(".total-cost-div,.all-total-cost-div,.after-items-price,.after-delivery-fee,.after-service-fee").text(currencyCode+"0.00");$$(".item-card-show").remove();
        }else{
            var msg = 'Error, Could not subscribe, please make sure your payment method is valid';
            var minIcon =  "<i class='material-icons color-tomato' style='font-size:150px;'>error_outline</i>";
        }
    }
    $$(".success-status-div").html("<div class='content-block'><center>"+minIcon+"</center><div class='content-block'><center style='font-weight:bolder;color:#757575;'>"+msg.toUpperCase()+"</center></div></div>");
    $$(".show-total-amount").html('0.00');
    $$(".display-items-cart-ul").html('');
}
function uploadFile(fileURI,filePath,mimeType,callback){
    var options = new FileUploadOptions();
    options.fileKey = "fileUrl";
    options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
    options.mimeType = mimeType;
    var params = new Object();
    params.filePath = filePath;
    options.params = params;
    options.chunkedMode = false;
    var ft = new FileTransfer();
    ft.upload(fileURI,serverUrl+'upload', function(response){
        callback('success');
    }, function(error){
         callback('error');
    },options);
}
function processCardPayment(cardNumber,expiryMonth,expiryYear,cvv,location,latitude,longitude,option,paymentMethod){
    var card = {number: cardNumber,expMonth: expiryMonth,expYear: expiryYear,cvc: cvv};
    var exp_date = expiryMonth+'/'+expiryYear;
    if(location=='remote'){
        var service_fee = serviceFee * 4;
    }else{
        var service_fee = serviceFee * 2;
    }
    service_fee = service_fee + (deliveryFee * 0.15);
    var amount = (parseFloat(service_fee) + parseFloat(totalCost)).toFixed(2);
    if(paymentGatewayObj.length>0){
        if(paymentGatewayObj[0].name=='STRIPE'){
            stripeAuth(card,amount,location,latitude,longitude,option,paymentMethod);
        }else if(paymentGatewayObj[0].name=='2CHECKOUT'){
            tCheckoutAuth(cardNumber,expiryMonth,expiryYear,cvv,amount,location,latitude,longitude,option,paymentMethod)
        }
        processStatus(30000);
    }else{
        showToast('Sorry this method is currently not available. Try paypal or cash');
    }
}
function stripeAuth(card,amount,location,latitude,longitude,option,paymentMethod){
    cordova.plugins.stripe.setPublishableKey(paymentGatewayObj[0].publicKey);
    cordova.plugins.stripe.createCardToken(card, function(obj){
        var tokenId = obj.id;
        var secretKey = paymentGatewayObj[0].secretKey;
        processPayment('STRIPE',amount,tokenId,secretKey,location,latitude,longitude,option,paymentMethod)
    }, function(errorMessage){
        alert(errorMessage)
    });
}
function tCheckoutAuth(cardNumber,expiryMonth,expiryYear,cvv,amount,location,latitude,longitude,option,paymentMethod){
    var args = {
        sellerId: paymentGatewayObj[0].otherKey,
        publishableKey: paymentGatewayObj[0].publicKey,
        ccNo: cardNumber,
        cvv: cvv,
        expMonth: expiryMonth,
        expYear: expiryYear
    };
    TCO.loadPubKey('production',function(){
       TCO.requestToken(function(data){
           var tokenId = data.response.token.token;
           var secretKey = paymentGatewayObj[0].secretKey;
           processPayment('2CHECKOUT',amount,tokenId,secretKey,location,latitude,longitude,option,paymentMethod);
       }, function(data){
           if (data.errorCode === 200) {
               tCheckoutAuth(card_number,exp_date,cvv,cb);
           } else {
               showToast("The seller is "+data.errorMsg+" to use this payment gateway");
           }
       }, args);
    });
}
function payPalProcess(secretKey,publicKey,amount,location,latitude,longitude,option){
    var itemListString = JSON.stringify(itemListArray);
    var purchaseDay = formatted_date(new Date());
    if(location=='remote'){
        var service_fee = serviceFee * 4;
    }else{
        var service_fee = serviceFee * 2;
    }
    service_fee = service_fee + (deliveryFee * 0.15);
    var inAppBrowserRef = cordova.InAppBrowser.open(serverUrl+'paypalProcess/'+currentShopId+'/secretKey/'+secretKey+'/publicKey/'+publicKey+'/amount/'+amount+'/location/'+location+'/latitude/'+latitude+'/longitude/'+longitude+'/option/'+option+'/itemListString/'+itemListString+'/loggedInUser/'+loggedInUser+'/totalBuying/'+totalBuying+'/purchaseDay/'+purchaseDay+'/totalWeight/'+totalWeight+'/currencyCode/'+currencyCode+'/serviceFee/'+service_fee+'/currentShopName/'+currentShopName+'/deliveryFee/'+deliveryFee+'/distanceFromStore/'+distanceFromStore, '_blank', 'location=no');
    inAppBrowserRef.addEventListener('loadstart', function(event){
        if(event.url == "https://www.smartstoreweb.net/paymentSuccess"){
            inAppBrowserRef.close();
            paymentSuccess(option,true)
        }else if(event.url == "https://www.smartstoreweb.net/paymentError"){
            paymentSuccess(option,false)
            inAppBrowserRef.close();
        }else{
            navigator.notification.activityStart('','Please Wait');
        }
    })
    inAppBrowserRef.addEventListener('loadstop', function(){
        navigator.notification.activityStop();
    });
}
function processPayment(paymentGateway,amount,tokenId,secretKey,location,latitude,longitude,option,paymentMethod){
    var socket = deviceReady.returnSocket();
    var otherKey = paymentGatewayObj[0].otherKey;
    var itemListString = JSON.stringify(itemListArray);
    if(location=='remote'){
        var service_fee = serviceFee * 4;
    }else{
        var service_fee = serviceFee * 2;
    }
    service_fee = service_fee + (deliveryFee * 0.15);
    if(option!="loadAccount"){
        socket.emit('processPayment',paymentGateway,amount,tokenId,secretKey,currentShopId,itemListString,loggedInUser,totalBuying,formatted_date(new Date()),totalWeight,currencyCode,otherKey,location,latitude,longitude,option,paymentMethod,service_fee,currentShopName,deliveryFee,distanceFromStore,function(cb){
            stopProcess();
            paymentSuccess(option,cb)
            if(cb!=false){
                if(paymentMethod=='AC'){
                    accountBal = (accountBal - parseFloat(amount));
                }
            }
        });
    }else{
        socket.emit("loadAccount",paymentGateway,paymentMethod,tokenId,secretKey,otherKey,currentShopId,currencyCode,loggedInUser,function(cb){
            mainView.router.load({pageName: 'payment-success-page'});
            stopProcess();
            if(cb==true){
                $$(".success-status-div").html("<div class='content-block'><center><i class='material-icons color-green' style='font-size:150px;'>check_circle</i></center><div class='content-block'><center style='font-weight:bolder;color:#757575;'>YOU HAVE SUCCESSFULLY LOADED YOUR ACCOUNT</center></div></div>");
            }else{
                $$(".success-status-div").html("<div class='content-block'><center><i class='material-icons color-tomato' style='font-size:150px;'>error_outline</i></center><div class='content-block'><center style='font-weight:bolder;color:#757575;'>THERE WAS AN ERROR OR YOUR CARD WAS DECLINED</center></div></div>");
            }
        });
    }
}
$$(document).on("click",".get-my-payment-gateways-btn",  function(e) {
    getGateways();
    mainView.router.load({pageName: 'payment-gateway-page'});
});
function getGateways(){
    var socket = deviceReady.returnSocket();
    $$(".all-gateways-ul").html("");
    socket.emit('get-my-gateways',currentShopId,function(result){
        stopProcess();
        if(result.length>0){
            for (var i = 0; i < result.length; i++){
                var id=result[i].id;
                var name=result[i].name;
                var publicKey=result[i].publicKey;
                var secretKey=result[i].secretKey;
                var otherKey=result[i].otherKey;
                var defaultStatus=result[i].defaultStatus;
                if(defaultStatus=='default'){
                    var defaultStatusIcon = "<i class='material-icons color-green'>check_circle</i>";
                }else{
                    var defaultStatusIcon = "<i class='material-icons color-gray'>more_vert</i>";
                }
                $$(".all-gateways-ul").append("<li gatewayId='"+id+"' id='"+id+"' name='"+name+"' publicKey='"+publicKey+"' secretKey='"+secretKey+"' otherKey='"+otherKey+"' defaultStatus='"+defaultStatus+"' data-popover='.popover-gateway-option' class='open-popover popover-gateway-option-btn'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-cyan'>credit_card</i></div><div class='item-inner'><div class='item-title' style='margin-top:10px;'>"+name+"</div><div class='item-after'>"+defaultStatusIcon+"</div></div></div></li>");
            }
        }else{
            showToast("You currently don't have any payment method. Click the add button to add")
        }
    })
    processStatus(10000);
}
$$(document).on("click",".popover-gateway-option-btn",  function(e) {
    var id = $$(this).attr("id");
    var name = $$(this).attr("name");
    var publicKey = $$(this).attr("publicKey");
    var secretKey = $$(this).attr("secretKey");
    var otherKey = $$(this).attr("otherKey");
    var defaultStatus = $$(this).attr("defaultStatus");
    $$(".gateway-ul-li-btn li a").attr("id",id).attr("name",name).attr("publicKey",publicKey).attr("secretKey",secretKey).attr("otherKey",otherKey).attr("defaultStatus",defaultStatus);
});
$$(document).on("click",".gateway-ul-li-btn li a",  function(e) {
    var id = $$(this).attr("id");
    var name = $$(this).attr("name");
    var publicKey = $$(this).attr("publicKey");
    var secretKey = $$(this).attr("secretKey");
    var otherKey = $$(this).attr("otherKey");
    var defaultStatus = $$(this).attr("defaultStatus");
    var action = $$(this).attr("title");
    if(action=='MAKE DEFAULT'){
        makeGateWayDefault(id,name,publicKey,secretKey,otherKey,defaultStatus);
    }else if(action=='REMOVE'){
        removeGateway(id,name,publicKey,secretKey,otherKey,defaultStatus);
    }else if(action=='EDIT'){
        editGateway(id,name,publicKey,secretKey,otherKey,defaultStatus);
    }
});
function makeGateWayDefault(id,name,publicKey,secretKey,otherKey,defaultStatus){
    var socket = deviceReady.returnSocket();
    if(name!="PAYPAL"){
        navigator.notification.confirm(name+' will be your default payment gateway!. Make sure it is activated',function(buttonIndex){
            if(buttonIndex==1){
                socket.emit('makeGateWayDefault',id,currentShopId,function(cb){
                    stopProcess();
                    if(cb){
                        getGateways();
                        getServiceAvailable();
                    }
                });
                processStatus(10000);
            }
        },'CONFIRM ACTION',['Proceed','Cancel']);
    }else{
        showToast("This is your alternative payment gateway")
    }
}
function removeGateway(id,name,publicKey,secretKey,otherKey,defaultStatus){
    var socket = deviceReady.returnSocket();
    navigator.notification.confirm(name+' will be deleted from your payment gateway lists',function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('removeGateway',id,currentShopId,function(cb){
                stopProcess();
                if(cb){
                    getGateways();
                }
            });
            processStatus(10000);
        }
    },'CONFIRM ACTION',['Proceed','Cancel']);
}
function editGateway(id,name,publicKey,secretKey,otherKey,defaultStatus){
   mainView.router.load({pageName: 'add-gateway-page'});
   $$(".add-update-gateway-btn").attr("title","update").attr("id",id);
   $$(".add-update-gateway-div").text("EDIT PAYMENT GATEWAY");
   $$(".list-block-gateway-selector").hide();
   $$(".publicKey-input").val(publicKey);
   $$(".secretKey-input").val(secretKey);
   $$(".otherKey-input").val(otherKey);
}
$$(document).on("click",".add-gateway-navigator",  function(e) {
    $$(".add-update-gateway-btn").attr("id","").attr("title","add");
    $$(".add-update-gateway-div").text("ADD PAYMENT GATEWAY");
    $$(".list-block-gateway-selector").show();
});
$$(document).on("click",".add-update-gateway-btn",  function(e) {
    var socket = deviceReady.returnSocket();
    var name = $$(".select-gateway-input").val();
    var publicKey = $$(".publicKey-input").val();
    var secretKey = $$(".secretKey-input").val();
    var otherKey = $$(".otherKey-input").val();
    var action = $$(this).attr("title");
    var id = $$(this).attr("id");
    if(publicKey!="" && secretKey!=""){
        if(action=='add'){
            navigator.notification.confirm('Have you carefully entered your gateway credentials? Click proceed button if yes',function(buttonIndex){
                if(buttonIndex==1){
                    socket.emit("addGateway",name,publicKey,secretKey,otherKey,currentShopId,function(cb){
                        stopProcess();
                        if(cb==true){
                            showToast("You have successfully added a new payment gateway");
                            $$(".publicKey-input,.secretKey-input,.otherKey-input").val("");
                            navigator.app.backHistory();
                            getGateways();
                        }else{
                            showToast('Payment gateway could not be added!');
                        }
                    });
                    processStatus(10000);
                }
            },'ADD GATEWAY',['Proceed','Cancel']);
        }else{
            navigator.notification.confirm('Have you carefully entered your gateway credentials? Click proceed button if yes',function(buttonIndex){
                if(buttonIndex==1){
                    socket.emit("editGateway",id,name,publicKey,secretKey,otherKey,currentShopId,function(cb){
                        stopProcess();
                        if(cb==true){
                            showToast("You have successfully updated your payment gateway");
                            navigator.app.backHistory();
                            getGateways();
                        }else{
                            showToast('Payment gateway could not be updated!');
                        }
                    });
                    processStatus(10000);
                }
            },'EDIT GATEWAY',['Proceed','Cancel']);
        }
    }else{
        showToast("You are missing some important values!");
    }
});
$$(document).on("click",".tnc-btn", function(e){
    var inAppBrowserRef = cordova.InAppBrowser.open('https://www.smartstoreweb.net/terms.html', '_blank', 'location=no');
    inAppBrowserRef.addEventListener('loadstart', function(event){
        navigator.notification.activityStart('','Please Wait');
    })
    inAppBrowserRef.addEventListener('loadstop', function(){
        navigator.notification.activityStop();
    });
});
$$(document).on("click",".search-printer-devices-btn", function(e){
    mainView.router.load({pageName: 'print-page'});
    $$(".show-printer-ul").html("");
    BTPrinter.list(function(data){
        var result = chunkArray(data, 3);
        for (var i = 0; i < result.length; i++){
            var printerName=result[i].printerName;
            var printerAddress=result[i].printerAddress;
            var printerType=result[i].printerType;
            $$(".show-printer-ul").prepend("<li><div class='item-content'><div class='item-inner'><div class='item-title'>"+printerName+"</div><div class='item-after'><a href='#' class='button connect-printer-btn' printerName='"+printerName+"' printerAddress='"+printerAddress+"'><i class='material-icons color-teal'>control_point</i></a><a href='#' class='button print-btn'><i class='material-icons color-teal'>print</i></a></div></div></div></li>");
        }
    },function(err){
        showToast(err);
    });
});
$$(document).on("click",".connect-printer-btn", function(e){
    var printerName = $$(this).attr("printerName");
    var printerAddress = $$(this).attr("printerAddress");
    BTPrinter.connect(function(data){
    	showToast(printerName+" has been connected!");
    	$$("[printerAddress='"+printerAddress+"']").html("<i class='material-icons'>check_circle</i>");
    },function(err){
    	showToast("Could not connect, please check your bluetooth connection");
    }, printerName);
});
$$(document).on("click",".print-btn", function(e){
    var itemListArray = printList;
    var printData = "<h3>"+currentShopName+"</h3> (#"+receiptNo+")("+currencyCode+" "+printAmount+")\n";
    for (var i = 0; i < itemListArray.length; i++){
        var price=itemListArray[i].price;
        var totalPrice=itemListArray[i].totalPrice;
        var quantity=itemListArray[i].quantity;
        var itemName=itemListArray[i].itemName;
        printData = printData + ""+itemName+" ---> ("+quantity+")("+price+")="+currencyCode+" "+totalPrice+"\n";
    }
    var stripedData = stripHtml(printData);
    BTPrinter.printTextSizeAlign(function(data){
        stopProcess();
        showToast("printed successfully!");
    },function(err){
        stopProcess();
        showToast(err)
    }, stripedData,'0','1')
    processStatus(5000);
});
function stripHtml(html){
    var temporalDivElement = document.createElement("div");
    temporalDivElement.innerHTML = html;
    return temporalDivElement.textContent || temporalDivElement.innerText || "";
}
function chunkArray(myArray, chunk_size){
    var index = 0;
    var arrayLength = myArray.length;
    var tempArray = [];
    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index+chunk_size);
        tempArray.push({printerName:myChunk[0], printerAddress:myChunk[1], printerType:myChunk[2]});
    }
    return tempArray;
}

var workingHours = [{day:'Sun',openTime:'8:00',closeTime:'20:00',id:1},{day:'Mon',openTime:'8:00',closeTime:'20:00',id:2},{day:'Tue',openTime:'8:00',closeTime:'20:00',id:3},{day:'Wed',openTime:'8:00',closeTime:'20:00',id:4},{day:'Thu',openTime:'8:00',closeTime:'20:00',id:5},{day:'Fri',openTime:'8:00',closeTime:'20:00',id:6},{day:'Sat',openTime:'8:00',closeTime:'20:00',id:7}]
$$(document).on("click",".show-working-hours-btn", function(e){
    mainView.router.load({pageName: 'working-hours-page'});
    var socket = deviceReady.returnSocket();
    socket.emit("customerLogin",currentShopId,function(result){
        $$(".working-hours-ul").html("");
        if(result[0].workingHours!=""){
            workingHours = JSON.parse(result[0].workingHours);
        }else{
            workingHours = workingHours;
        }
        workingHours = workingHours.sort((a, b) => Number(a.id) - Number(b.id));
        for (var i = 0; i < workingHours.length; i++){
            var day=workingHours[i].day;
            var openTime=workingHours[i].openTime;
            var closeTime=workingHours[i].closeTime;
            var id=workingHours[i].id;
            $$(".working-hours-ul").append("<li class='working-option-btn' id='"+day+"' counter='"+id+"'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>today</i></div><div class='item-inner'><div class='item-title' style='margin-top:10px;'>"+day+"</div><div class='item-after' id='time"+day+"'>"+openTime+"-"+closeTime+"</div></div></div></li>");
        }
    });
});
$$(document).on("click",".working-option-btn", function(e){
    var day = this.id;
    var counter = $$(this).attr("counter");
    myApp.actions([
       [
           {
               text: 'UPDATE OPEN TIME',
               onClick: function () {
                   updateWorkingHours(day,'OPEN',counter);
               }
           },{
               text: 'UPDATE CLOSE TIME',
               onClick: function () {
                  updateWorkingHours(day,'CLOSE',counter);
               }
           }
       ]
    ]);
});
function updateWorkingHours(day,status,counter){
    $$(".hours-status-header").text(day+" "+status+" HOURS");
    $$(".working-hours-select-ul").html("");
    for (var i = 0; i < 25; i++){
        var hours = i+":00";
        $$(".working-hours-select-ul").append("<li id='"+hours+"' day='"+day+"' status='"+status+"' counter='"+counter+"'><div class='item-content item-link'><div class='item-media'><i class='material-icons color-teal'>today</i></div><div class='item-inner'><div class='item-title' style='margin-top:10px;'>"+hours+"</div></div></div></li>");
    }
    mainView.router.load({pageName: 'working-hours-select-page'});
}
$$(document).on("click",".working-hours-select-ul li", function(e){
    var socket = deviceReady.returnSocket();
    var hours = $$(this).attr("id");
    var day = $$(this).attr("day");
    var counter = $$(this).attr("counter");
    var status = $$(this).attr("status");
    var currentHours = $$("[id='time"+day+"']").text();
    if(status=="OPEN"){
        $$("[id='time"+day+"']").text(hours+"-"+currentHours.split('-')[1]);
        removeItemDay(workingHours,day)
        workingHours.push({day:day,openTime:hours,closeTime:currentHours.split('-')[1],id:counter});
    }else{
        $$("[id='time"+day+"']").text(currentHours.split('-')[0]+"-"+hours);
        removeItemDay(workingHours,day)
        workingHours.push({day:day,openTime:currentHours.split('-')[0],closeTime:hours,id:counter});
    }
    navigator.app.backHistory();
    socket.emit("updateWorkingHours",currentShopId,JSON.stringify(workingHours),function(cb){
        if(cb==true){
            showToast("Your working hours were updated!");
        }else{
            showToast("Could not update working hours!");
        }
    })
});
function isStoreOpen(workingHours){
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var d = new Date();
    var dayName = days[d.getDay()].slice(0,3);
    var hour = d.getHours();
    workingHours = JSON.parse(workingHours);
    for (var i = 0; i < workingHours.length; i++){
        var day=workingHours[i].day;
        var openTime=workingHours[i].openTime;
        var closeTime=workingHours[i].closeTime;
        var id=workingHours[i].id;
        if(day==dayName){
            if((hour >= parseFloat(openTime.split(':')[0])) && (hour < parseFloat(closeTime.split(':')[0]))){
                openStatus = true;
                $$(".store-closed-btn").html("<i class='material-icons color-teal' style='font-size:50px;'>lock_open</i>").attr("title","This Store is open and scheduled to be closed at "+closeTime);
            }else{
                openStatus = false;
                $$(".store-closed-btn").html("<i class='material-icons color-red' style='font-size:50px;'>lock_outline</i>").attr("title","This Store is closed. You can not make any purchase from it!. Please try after "+openTime);
            }
        }
    }
}
$$(document).on("click",".special-deals-btn", function(e){
    var socket = deviceReady.returnSocket();
    mainView.router.load({pageName: 'pawnOrSell-nearby-page'});
    $$(".local-store-agents").text("LOCAL SPECIAL DEALS");
    $$(".pawn-sell-nearby-ul").html("");
    $$(".hide-on-agents").hide();
    getGPS(function(latitude,longitude){
        socket.emit("getLocalStores",latitude,longitude,function(result){
            if (result.length>0) {
                var len = result.length;
                result.forEach(function(item, i) {
                    var shopName=result[i].shopName;
                    var shopId=result[i].shopId;
                    var lati=result[i].latitude;
                    var longi=result[i].longitude;
                    var staffPhone=result[i].staffPhone;
                    socket.emit("getShopsWithSpecial",shopId,function(res){
                        stopProcess();
                        if(res.length>0){
                            $$(".pawn-sell-nearby-ul").prepend("<li><div class='item-content'><div class='item-inner'><div class='item-title'>"+shopName+"</div><div class='item-after'><a href='#' class='button view-specials-btn' shopId='"+shopId+"' specials='"+JSON.stringify(res)+"'><span style='margin-top:-5px;color:#757575;'>"+res.length+"</span><i class='material-icons color-orange'>grade</i></a><a href='#' class='button getLocationBtn' latitude='"+lati+"' longitude='"+longi+"' shopName='"+shopName+"'><i class='material-icons color-teal'>location_on</i></a></div></div></div></li>");
                        }else{
                            len--;
                        }
                        if(len==0){
                            showToast("Oops! There are no specials at the moment!")
                        }
                    });
                })
            }else{
                showToast("Sorry!, We could not find local stores for you!");
            }
        });
    });
    processStatus(10000);
});
$$(document).on("click",".view-specials-btn",  function(e) {
    currentShopId = $$(this).attr("shopId");
    selfLogin(currentShopId,'specials');
});
$$(document).on("change",".advanced-checkbox",  function(e) {
    var clickedBtn = $$(this).attr("title");
    var socket = deviceReady.returnSocket();
    if($(this).attr("checked")){
        $(this).removeAttr("checked");
        var checkedStatus = false;
        var status = "FALSE";
    }else{
        $(this).attr('checked','checked');
        var checkedStatus = true;
        var status = "TRUE";
    }
    if(checkedStatus){
        if(clickedBtn=='online-store-checkbox'){
            var msg = 'By enabling online store feature, You agree that local customers can make online purchases from your store?';
        }else if(clickedBtn=='pawn-buy-checkbox'){
            var msg = 'By enabling pawning feature you agree that you are allowed by the law to operate in that area. Smart Store is not responsible for any inconvenience.';
        }else if(clickedBtn=='own-drivers-checkbox'){
            var msg = 'By enabling smartStore driver you agree that smartStore drivers will be responsible for delivering items to your customers?';
        }
    }else{
        if(clickedBtn=='online-store-checkbox'){
            var msg = 'By disabling online store feature, You agree that local customers can not make online purchases from your store?';
        }else if(clickedBtn=='pawn-buy-checkbox'){
            var msg = 'By disabling pawning feature you agree that your store will no longer provide this feature';
        }else if(clickedBtn=='own-drivers-checkbox'){
            var msg = 'By disabling smartStore driver you agree that you have your own drivers to take care of the delivery';
        }
    }
    if(clickedBtn=='online-store-checkbox'){
        var column = 'remoteOrdering';
    }else if(clickedBtn=='pawn-buy-checkbox'){
        var column = 'pawnBuy';
    }else if(clickedBtn=='own-drivers-checkbox'){
        var column = 'smartDriver';
    }
    navigator.notification.confirm(msg,function(buttonIndex){
        if(buttonIndex==1){
            socket.emit('updateAdvanced',column,status,currentShopId,function(cb){
                stopProcess();
                if(cb){
                    showToast("Your updates were successful!");
                }
            });
            processStatus(10000);
        }
    },'CONFIRM UPDATE',['I Agree','No']);
});