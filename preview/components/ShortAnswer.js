
var ShortAnswer = {
    
    props:["data"],
    template: 
        `<div class="md-form" 
            v-if="data.type=='ShortAnswer'" >
            <input type="text" class="form-control h5-responsive" placeholder="Enter your answer here..." 
                v-model="data.answer" 
                v-on:keyup.enter="$emit('next', $event)"
                v-validate="'email'"
                v-bind:name="'question_'+data.id"/>		
            <span class="text-danger">{{ errors.first('question_'+data.id) }}</span>
        </div>
        `,
    methods:{
        

    }

}

export {ShortAnswer};