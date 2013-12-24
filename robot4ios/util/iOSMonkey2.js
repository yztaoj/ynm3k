function iOSMonkey2(){

	this.elementArray = null;
	this.history = {};

	this._findHistory = function(element){
		var key = this._getElementAncestry(element)+element.toString()+element.name()+element.value()+element.label();

		if (this.history[key]){
			this.history[key] = (this.history[key] + 1) % 4;
			return this.history[key]?true:false;
		}
		else{
			UIALogger.logWarning("new key: "+key);
			this.history[key] = 1;
			return false;
		}
	}

	this._sameElement = function(e1, e2){
		while(e1 && e1.isValid() && e2 && e2.isValid()){
			if(e1.toString() !== e2.toString() ||
				e1.name() !== e2.name() ||
				e1.value() !== e2.value() ||
				e1.label() !== e2.label())
				return false;
			e1 = e1.parent();
			e2 = e2.parent();
		}

		return true;
	}

	this._addToArray = function(root, childLen){
		var name = root.name();
		if (name && name.match("notap$") ||
			this._isIndicator(root) ||
			root.toString() == "[object UIAKey]" ||
			!root.isEnabled() ||
			!root.isVisible())
			return;

		if(childLen == 0){
			var rect = root.hitpoint();
			if(rect && rect.y > 20){
				this.elementArray.push(root);
			}
		} 
		else if(this._toFlick(root) || this._toType(root)){
			this.elementArray.push(root);
		}

	}

	this._iterator = function(root){
		var className = root.toString();
		if(className =="[object UIAWebView]" || className == "[object UIAKeyboard]")
			return;

		var eleArray = root.elements();
		this._addToArray(root,eleArray.length);

		for(var i = 0; i< eleArray.length; i++){
			this._iterator(eleArray[i]);
		}
	}

	this._tryLogin = function(usr, psw){
		UIATarget.localTarget().pushTimeout(0.001);
		var ret = true;
		var app = UIATarget.localTarget().frontMostApp();
		var mainWindow = UIATarget.localTarget().frontMostApp().mainWindow();
		var tableView = mainWindow.tableViews().firstWithPredicate("isEnabled == 1");

		if(mainWindow.buttons()["登录"].isValid() &&
		   tableView.isValid() &&
		   tableView.cells()[0].textFields().isValid() &&
		   tableView.cells()[0].secureTextFields().isValid()){
			
			tableView.cells()[0].textFields()[0].setValue(usr);
			tableView.cells()[0].secureTextFields()[0].setValue(psw);
			mainWindow.buttons()["登录"].tap();
			//delay 4 second to handle any possible alerts
			UIATarget.localTarget().delay(4);
			if(mainWindow.buttons()["登录"].isValid() &&
				mainWindow.buttons()["取消"].isValid()){
				mainWindow.buttons()["取消"].tap();
				ret = false;
			}
		}
		UIATarget.localTarget().popTimeout();
		return ret;
	}

	this._isIndicator = function(element){
		return element.toString().match("Indicator]$")=="Indicator]";
	}

	this._findIndicator = function(root){
		if(!root.isValid() || !root.isVisible()) return 0;

		var elements = root.elements();
		for(var i =0; i<elements.length; i++){
			return this._isIndicator(elements[i])?
				true : this._findIndicator(elements[i]);
		}
	}

	this._getElementAncestry = function(element){
		var arr = element.ancestry();
		var tmp = ""
			for(var i = 0; i< arr.length; i++){
				tmp += arr[i].toString()+"->"
			}
		return tmp;
	}

	this._selector = function(){
		this.elementArray = new Array();
		this._iterator(UIATarget.localTarget().frontMostApp());

		var len = this.elementArray.length;
		if (!len) throw 'no UI element!!!!';

		var position = Math.floor(Math.random()*len);
		while(this._findHistory(this.elementArray[position])){
			position = Math.floor(Math.random()*len);
		}

		//UIALogger.logMessage(len+"");
		return this.elementArray[position];
	}

	this._toFlick = function(element){
		if(element.toString()=="[object UIATableView]" || element.toString()=="[object UIAScrollView]" || element.toString()=="[object UIATableCell]"){
			return 1;
		}
		return 0;
	}

	this._toType = function(element){
		if(element.toString()=="[object UIATextField]" || element.toString()=="[object UIASecureTextField]" || element.toString()=="[object UIATextView]"){
			return 1;
		}
		return 0;
	}

	this._tap = function(element){
		if(element.toString()=="[object UIASwitch]"){
			if(element.value() != "" && element.value() != null){
				element.setValue(this._falseString(element.value()));
			}
		}else{
			//var x = Math.random().toFixed(2);
			//var y = Math.random().toFixed(2);
			//element.tapWithOptions({tapOffset:{x:x,y:y}});
			element.tap();
		}

	}


	this._flick = function(element){
		//element.scrollToVisible();
		var x = Math.random().toFixed(2);
		var y = Math.random().toFixed(2);
		element.flickInsideWithOptions({startOffset:{x:0.5, y:0.5}, endOffset:{x:x,y:y}});
	}

	this._type = function(element){
		var len = Math.round(Math.random()*100);
		var value = this._randomChar(len);
		element.setValue(value);
	}

	this._falseString = function(value){
		return (value=="0")?"1":"0";
	}

	this._randomChar = function(len){
		var  x="0123456789qwertyuioplkjhgfdsazxcvbnm";
		var  tmp="";
		for(var i = 0;i < len;i++){
			tmp += x.charAt(Math.ceil(Math.random()*100000000)%x.length);
		}
		return  tmp;
	}


	this.operator = function(){
		var element = this._selector();
		if(!element || !element.isValid()) return;
		//UIALogger.logMessage("本次操作的对象的类型是："+element.toString());
		element.logElementTree();
		var ancestry = this. _getElementAncestry(element);
		UIALogger.logMessage(ancestry+element.toString()+"->name:"+element.name());
		if (this._toFlick(element)){
			this._flick(element);
		}else if(this._toType(element)){
			this._type(element);
		}else{
			if(element.hitpoint() != null){
				this._tap(element);
			}
		}
	}

	this.screenShoot = function(imageName){
		var target = UIATarget.localTarget();
		var app = target.frontMostApp();
		target.captureRectWithName(target.frontMostApp().rect(),imageName);
	}

	this.waitForLoad = function(preDelay) {        
		var target = UIATarget.localTarget();
		target.delay(preDelay?preDelay:0);

		this._tryLogin(userName, passWord);

		var counter = 60;
		while(counter--){
			if(this._findIndicator(target.frontMostApp())){
				UIALogger.logMessage("loading contents...");
				target.delay(0.5);
			}
			else{
				break;
			}
		}
		//target.delay(0.5);
	}
}

var mon = new iOSMonkey2();
var userName = 'mtlonline'+(Math.floor(Math.random()*300)+340);
var passWord = 'ALIhjsdmn1314';
var localTarget = UIATarget.localTarget();
var bundleId = localTarget.frontMostApp().bundleID();

localTarget.pushTimeout(0);
var startButton = localTarget.frontMostApp().mainWindow().scrollViews()[0].buttons()[0];
if(startButton.isValid()) startButton.scrollToVisible();
for(var i = 0; i< 1000000; i++){
	try{
		mon.operator();
	}catch(err){
		UIALogger.logError("这里有一个异常");
		UIALogger.logMessage(err.toString()+"");
	}
	//mon.screenShoot("test");
	mon.waitForLoad(0.5);
}
localTarget.popTimeout();
