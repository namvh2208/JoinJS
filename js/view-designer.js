var test;

var app =  new Vue({
	el:"#main",
	data:{
		questions:[],
		questionsSample:[],
		selectedQuestion:null,
		questionCounter:0,
		jumpCounter:0,
		settings:{},
		actions:[],
		selectedAction:{},
		lib:""
	},	
		
	watch:{
		'selectedQuestion.temp.options':function(val)
		{
			if (val===undefined)
				return;
			
			else if(val=="")
				this.selectedQuestion.options=[];
			
			else
				this.selectedQuestion.options = val.split("\n").filter(String);
		}
		
		
		/*'selectedQuestion.temp.visibility': function(val)
		{
			this.selectedQuestion.visibility = this.replaceExpression(val);
		},
		'selectedQuestion.temp.enable': function(val)
		{
			this.selectedQuestion.enable = this.replaceExpression(val);
		},
		'selectedQuestion.jumps': function(val)
		{
			console.log("change");
			//this.selectedQuestion.enable = this.replaceExpression(val);
		}
		*/
	},
	
	methods:{
		addQuestion: function(){
			this.questions.push({
				id:this.questionCounter++,
				type:"ShortAnswer",
				caption:"",
				jumps:[],
				answers:[],
				temp:{},
				validate:{}
				
			});
						
		},
		
		addSampleQuesion: function(event){
			this.questions[event.newIndex] = Object.assign({}, this.questions[event.newIndex]);
			this.$set(this.questions[event.newIndex],"id",  this.questionCounter++);
			this.$forceUpdate();
		},
		
		addAction: function()
		{
			this.actions.push({
				name:"ActionName",
				body:""
			});
		},
		
		newId: function()
		{
			return this.questionCounter++;
		},
		
		removeQuestion:function(q){
			this.questions = this.questions.filter(x=>x.id!=q.id);
		},
		
		showDetail: function(q){
			this.selectedQuestion = q;
		},
		
		showActionDetail: function(a)
		{
			this.selectedAction = a;
		},
		
		addJump: function(){		
			this.selectedQuestion.jumps.push({
				expression: "",
				jumpTo:"",
				id:this.jumpCounter++,
				temp:{}
			});
		},
		removeJump:function(j){
			this.selectedQuestion.jumps= this.selectedQuestion.jumps.filter(x=>x.id!=j.id);
		},
		
		removeAction(a)
		{
			this.actions = this.actions.filter(x=>x!=a);
		},
		
		shortType: function(type)
		{
			switch(type)
			{
				case "ShortAnswer": return "SA";
				case "LongAnswer": return "LA";
				case "Multiple": return "M";
				case "Radio": return "R";
				case "YesNo": return "YN";
				case "Confirm": return "C";
				case "Email": return "@";
				case "Number": return "#";
				case "DateTime": return "DT";
			}
			
		},
		
		replaceExpression: function(expression)
		{
			let regex = /{(.*?)}/g;
			
			return isEmptyString(expression)?expression:
				expression.replace(regex, (match, qid) => {
					for(let i=0; i<this.questions.length; i++)
					{
						let question = this.questions[i];
						if(question.id == qid)
						{
							if(["Multiple", "Radio"].includes(question.type))
								return `app.questions[${i}].answers`;
							
							return `app.questions[${i}].answer`;
						}
					}
					
					throw `invalid question id ${qid} in visibility rule of question #${q.id}`;
				});
			
		},
		
		//string contains `` >>  html 
		replaceCode: function(str)
		{
			let regex = /(`(.*?)`)|({(.*?)})/g;
			
			return isEmptyString(str)?str:
				str.replace(regex, (match) => {
					let errors = validateExpression(match);
					if (errors.length>0)
					{
						let title = errors.map(x=>x.msg).join("\n");
						return `<kbd title='${title}' style='background:#f00'>${match}</kbd>`
					}
					return `<kbd>${match}</kbd>`;
				});
		},
		
		//html string >> string contains `` 
		replaceCode2: function(html)
		{
			let regex = /(<kbd>)(.*?)(<\/kbd>)/g;
			
			return isEmptyString(html)?html:
				html.replace(regex, (match, code) => {
					
					return "`" + code + "`";
				});
		},
		
		
		
		search: function(keyword){
			this.questions.map(q=>{
				q.temp.display = isEmptyString(keyword) 
					|| q.caption.toLowerCase().includes(keyword.toLowerCase());
			})
		},
		
		finalize:function(){
			
			var lib = "";
			this.actions.map(a=>{
				
				if(a.name.includes("(")||a.name.includes(")"))
					lib += `function ${a.name} {${a.body}}\n`;
				else	
					lib += `function ${a.name} () {${a.body}}\n`;
			});
			this.lib = lib;
			
			this.questions.map(q=>{
				q.enable = this.replaceExpression(q.temp.enable);
				q.visibility = this.replaceExpression(q.temp.visibility);
				q.preaction = this.replaceExpression(q.temp.preaction);
				q.postaction = this.replaceExpression(q.temp.postaction);
				
				
				q.jumps.map(j=>{
					j.expression = this.replaceExpression(j.temp.expression);
				});
				
				/*//add validator for email
				q.validate.email = q.type=="Email";
				
				//add validator for number
				q.validate.numeric = q.type=="Number";
				*/
				
				delete q.validate.email;
				delete q.validate.numeric;
			});
			
		}

	}
	
	
});



$(document).ready(function(){
	$.get("questions.json", function(data){
		app.questions = data.questions;
		app.selectedQuestion = data.selectedQuestion;
		app.questionCounter = data.questionCounter;
		app.jumpCounter = data.jumpCounter;
		app.settings = {};
		app.actions = data.actions;
		
		
	})
	
	$.get("questionsSample.json", function(data){
		app.questionsSample = data.questions;
	})
	
	$("#export").click(function(){
		app.finalize();
		
		let exportdata = Object.assign({}, app.$data);
		delete exportdata.questionsSample;
		
		
		$("#clipboard").val(JSON.stringify(exportdata)).select();
		document.execCommand("copy");
		//console.log();
	})
	
	$("#show-side-nav").click(function(){
		if($("#side-nav").width()==0)
		{
			$("#workspace").css("margin-left", "400px");
			$("#side-nav").css("width", "400px");
		}
		else
		{
			$("#workspace").css("margin-left", "0");
			$("#side-nav").css("width", "0");
		}
	})
	
})

//CUSTOM FUNCTIONS
function isEmptyString(str)
{
	return str == null || str == '' || str == undefined;
}

function validateExpression(expression)
{
	let errors=[];
	
	//validate action name
	
	//TODO - Get the correct list of valid_action_names from app.actions
	let valid_action_names =["Add", "eval", "IsAuthor"];
	
	let regex = /(\w+)\s*\(/g;
	let match;
	//let action_names = []; 
	while(match = regex.exec(expression))
	{
		//action_name.push(match[1]);
		let action_name = match[1];
		if(!valid_action_names.includes(action_name))
			errors.push({msg:`Invalid action name "${action_name}".`});
	}
	
	//validate question id
	let valid_qids = app.questions.map(x=>x.id.toString());
	regex = /{(.*?)}/g;
	while(match = regex.exec(expression))
	{
		let qid = match[1];
		if(!valid_qids.includes(qid))
			errors.push({msg:`Invalid question id "${qid}".`});
	}
	
	return errors;
	
	
	
}
