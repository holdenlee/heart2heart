
$(document).ready(function(){

	var qc = new QuestionController();
	
	$('#question-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			//if (av.validateForm() == false){
			//	return false;
			//} 	else{
			//// push the disabled username field onto the form data array //
			//	formData.push({name:'user', value:$('#user-tf').val()})
			//	return true;
			//}
		        //formData.push({user: 'user', value: $('#q-tf').val()});
		},
		success	: function(responseText, status, xhr, $form){
			//if (status == 'success') qc.onUpdateSuccess();
		},
		error : function(e){
			//if (e.responseText == 'email-taken'){
			//	av.showInvalidEmail();
			//}	else if (e.responseText == 'username-taken'){
			//	av.showInvalidUserName();
			//
		}
	});
	$('#q-tf').focus();

// customize the account settings form //
	$('#question-form-btn-add').html('Submit');
	$('#question-form-btn-add').addClass('btn-primary');


// setup the confirm window that displays when the user chooses to delete their account //
});
