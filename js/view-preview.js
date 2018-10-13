//import {ShortAnswer} from '../preview/components/ShortAnswer.js';


//Vue.component('shortanswer', ShortAnswer);

Vue.use(VeeValidate);
const dictionary = {
  en: {
    messages: {
      required: function () { 
        return "This question is required"
      },
      email: function () { 
        return "Invalid Email format"
      },
	  numeric: function () { 
        return "Invalid number format"
      }
    }
  }
};
VeeValidate.Validator.localize(dictionary);






var app =  new Vue({
	el:"#main",
	data:{
		questions:[],
		selectedQuestion:null,
		questionCounter:0,
		jumpCounter:0,
		temp:{
			errors:[]
		}
		
	},	
	methods:{
		isVisible: function(q)
		{		
			if(q.visibility==null ||q.visibility=="")
				return true;

			return this.evalExpression(q.visibility);
		},
			
		isEnable: function(q)
		{
			if(q.enable==null ||q.enable=="")
				return true;

			return this.evalExpression(q.enable);
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
			}
			
		},
		
		compileString: function(str)
		{
			if(isEmptyString(str))
				return str;
					
			//ie:str = "Hello {0}, your option is `Param.test=={0}?1:0`."

			//look for all content inside ``
			let res = str.replace(/`(.*?)`/g, (match, expression) => {
				//console.log({match, expression});
				
				//replace the{qid} by questions[index].answers string.
				let r = this.replaceExpression(expression)
				
				//evaluate the flatten content inside ``
				return this.evalExpression(r);
			});
			
			
			//replace the {qid} by app.questions[index].answer(s) for other contents outside the ``
			res = res.replace(/{(.*?)}/g, (match, qid) => {
				for(let i=0; i<this.questions.length; i++)
				{
					let question = this.questions[i];
					if(question.id == qid)
					{
						let blankTemplate = `<span onClick='scrollToQuestion(${qid})' class='blank' title='${question.caption}'></span>`;
						
						if(["Multiple"].includes(question.type))
							return app.questions[i].answers
										.map(x=>app.questions[i].options[x])
										.join(", ");
						
						else if(["Radio"].includes(question.type))
							return app.questions[i].options[app.questions[i].answer];
										
						return isEmptyString(app.questions[i].answer)?blankTemplate:app.questions[i].answer;
					}
				}
				
				throw  `invalid question id ${qid} in visibility rule of question #${q.id}`;
			});
			
			
			return res;
			
		},
		
		replaceExpression(expression)
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
		
		getNextQuestion: function(q)
		{	
			if(!q && this.questions.length>0)
				return this.questions[0];

		
			var currentQuestion=q;
			
			//first check the jump conditions of selected question
			//if there is match jump condition, evaluate the jump question's enable and visibility rule
			//	if valid then return the question, else check the next question, jump to the appropriate question
			
			//else, find the next question in this.questions array, evaluate the enable and visibility rule
			//	if valid then return the question, else check the next question
			

			for(let i = 0; i<currentQuestion.jumps.length; i++)
			{
				let jump = currentQuestion.jumps[i];
				let jumpEval = this.evalExpression(jump.expression);
				
				//console.log(i + " - " +jumpEval);
				
				if(jumpEval==true)
				{
					//TODO - validate if jumpTo is a valid number
					let tempQuestion = this.getQuestionById(jump.jumpTo);
					
					if(this.isEnable(tempQuestion) && this.isVisible(tempQuestion))
					{
						return tempQuestion;
						break;
					}
					else
					{
						console.log(`ERROR: question ${tempQuestion.id} is not enable or visible`);
						break;
					}
				}
			}
		

			let currentQuestionIndex  = this.questions.indexOf(currentQuestion);
			
			while(++currentQuestionIndex < this.questions.length)
			{
				let tempQuestion = this.questions[currentQuestionIndex];
				if(this.isEnable(tempQuestion) && this.isVisible(tempQuestion))
				{
					return tempQuestion;
					break;
				}
			}
			
	
			return null;
		},
		
		//waitTime is use in case of select an answer which will jump immediately to the next question. ie: YesNo, Radio
		
		moveToNextQuestion: function(q, waitTime)
		{	
			this.$forceUpdate();
			
			//Run currentQuestion's PostAction
			if(q && !isEmptyString(q.postaction))
				this.evalExpression(q.postaction);
		
		
			let nextQuestion = this.getNextQuestion(q);
			if(nextQuestion!=null)
			{
				//Run nextQuestion's PreAction
				if(!isEmptyString(nextQuestion.preaction))
					this.evalExpression(nextQuestion.preaction);
					
				this.selectedQuestion = nextQuestion;			
				
				if(waitTime)
					setTimeout(function(){
						scrollToQuestion(nextQuestion.id)
					}, waitTime);
				else
					scrollToQuestion(nextQuestion.id);
			}
		},
		
		getQuestionById: function(id)
		{
			var filter = this.questions.filter(x=>x.id==id);
			if(filter.length>0)
				return filter[0];
			
			throw `invalid question id ${id}`;
		},
		
		questionId2Index: function(id)
		{
			for(let i = 0; i<this.questions.length; i++)
			{
				if(this.questions.id == id)
					return i;
			}
			
			throw `invalid question id ${id}`;
		},
		scrollToQuestion: function(qid)
		{			
			scrollToQuestion(qid);
		},
		
		evalExpression: function(expression)
		{
			return eval(this.lib + "\n" + expression);
		},
		
		submit: function()
		{
			this.$validator.validateAll().then((result)=>{
				this.temp.errors = [];
				
				if(result)
				{
					console.log(this.questions);
					alert("Your response has been submitted.");
				}
				else
				{
					//alert("Please fix errors before submitting the form");
					
					
					this.$validator.errors.items.map(x=>{
						if(this.temp.errors.find(e=>e.field==x.field)===undefined)
							this.temp.errors.push(x);
					});
				}
				this.$forceUpdate();
			});

		},
		
		removeError: function(err)
		{
			this.temp.errors = this.temp.errors.filter(x=>x!=err);
		}

		
	}
	
	
});


var Param={};


$(document).ready(function(){

	$.get("questions.json", function(data){
		app.questions = data.questions;
		app.selectedQuestion = data.selectedQuestion;
		app.questionCounter = data.questionCounter;
		app.jumpCounter = data.jumpCounter;
		app.settings = {};
		app.lib = data.lib;
		
		//console.log(data.lib)
		
		//eval(app.lib);
		
		app.$nextTick(function(){
			//scrollToQuestion(0);
			app.moveToNextQuestion();
			
		})
	})
	
	//highlight the question while scrolling if the question in middle of the screen
	$("#placeholder").scroll(function(){
		var placeholder = $(this);
		$(".question").each(function(index, question){
			var offset = $(question).offset();
			var midLine = $(document).height()/2;
			var offsetBottom = offset.top + $(question).height() + 32;
			if(offset.top< midLine && offsetBottom>midLine)
			{
				//highlight selectedQuestion
				$("#placeholder > .active").removeClass("active");
				$(question).addClass("active");
				
				//focus on input/button
				$(question).find("input, button").first().focus();
				
				
				//set selectedQuestion
				let qid = $(question).attr("data-qid");
				if(!app.selectedQuestion || (app.selectedQuestion && qid!=app.selectedQuestion.id))
				{	
					app.selectedQuestion = app.questions.filter(q=>q.id==qid)[0];
					//console.log(app.selectedQuestion.id);
				}
			}
		})
	})
	
})



//CUSTOM FUNCTIONS
function isEmptyString(str)
{
	return str == null || str == '' || str == undefined;
}

function scrollToQuestion(qid)
{
	let question = $("#question_"+qid);
	
	//focus on input/button
	question.find("input, button").first().focus();	
	
	let offset = ($(document).height() - question.height() - 32)/2;
	$("#placeholder").scrollTo(question, 500, {
		offset:-offset
	});
	
	return false;
}



