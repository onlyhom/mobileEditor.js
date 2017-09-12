//弹出窗口
$('#add-link').click(function(){
  $('.pop-link').addClass('pop-show');
});

$('#add-reply').click(function(){
  $('.pop-reply').addClass('pop-show');
});

$('.pop-bg,.close-btn').click(function(){
    $('.pop').removeClass('pop-show');
});
//阻止事件冒泡
$(".pop-up").click(function(event){
    event.stopPropagation();        
});

function deleteFile(_this, isConfirm){
	var fileName = _this.siblings().eq(0).text();
	var agree = false;
	if(isConfirm){
		if(confirm('确认删除附件"'+ fileName +'"?')){
			agree = true;
		}
	}else{
		agree = true;
	}
	if(agree){
		$.ajax({
		     type: 'POST',
		     url: "mudelImg.action" ,
		     dataType:'json',
		     data: {"fileName":fileName} ,
		     success: function(result){
		    	 if(result.code==1){
		    		alert("删除成功！");

                    var fileNameList = $('.file-list .file-name');
                    var length = fileNameList.size();
                    for(var i = 0; i<length; i++){
                        if(fileName == fileNameList.eq(i).text()){
                            isUploadingArr.splice(i, 1);
                            break;
                        }
                    }
		    		_this.parent().addClass('delete-animate');
		    		setTimeout(function(){
		    			_this.parent().remove();	
		    		},600);
		    	 }
		    	 if(result.code==0){
		    		alert("删除失败！,请稍后重试！");
		    		return;
		    	}
		     } 
		});
	}
}


$(function () {
    "use strict";
	//编辑器
    $('#editor').artEditor({
        imgTar: '#imageUpload',
        linkTar:'#link-insert',
        limitSize: 10,   // 兆
        showServer: true,
        uploadUrl: 'muuploadImg.action',
        data: {},
        uploadField: 'imageUpload',
        breaks: false,
        placeholader: '请输入正文内容',
        validHtml: ["<br/>"],
        formInputId: 'article_content',
        uploadSuccess: function (res) {
        	// showServer == true 代表插入图片时 
        	// 向服务器上传图片 并返回图片地址 插入到文本中
            // 此回调是处理返回数据业务逻辑的地方
            // `res`为服务器返回`status==200`的`response`
            // 如果这里`return <path>`将会以`<img src='path'>`的形式插入到页面
            // 如果发现`res`不符合业务逻辑
            // 比如后台告诉你这张图片不对劲
            // 麻烦返回 `false`
            // 当然如果`showServer==false`
            // 就无所谓
            var result = res;
            if (result['code'] == '100') {
                return result['url'];
            } else {
                switch (result['code']) {
                    case '101': {
                        alert('图片太大之类的')
                    }
                }
            }
            return false;
        },
        uploadError: function (status, error) {
            //这里做上传失败的操作
            //也就是http返回码非200的时候
            alert('网络异常' + status)
        }
    });

	//附件上传
    var url = 'muuploadFile.action';
    // var url = '//jquery-file-upload.appspot.com/';
    $('#fileupload').fileupload({
        url: url,
        dataType: 'json',
        add: function (e, data) {
            var maxSize = 50; //兆
            var fileSize = data.files[0].size;
        	var fileName = data.files[0].name;
            var fileNameList = $('.file-list .file-name');
            var length = fileNameList.size();

            if( fileSize > maxSize*1024*1024 ){
                alert('附件大小不能超过'+maxSize+'M');
                return false;
            }

            for(var i = 0; i<length; i++){
            	if(fileName == fileNameList.eq(i).text()){
            		alert('不可上传同名文件');
            		return false;
            	}
            }
            data.submit();
            $('.loading').show();
        },
        done: function (e, data) {
        	var fileName = data.result.fileName;
        	isUploadingArr.push({
                fileName : fileName,
                isUploading : false
            });
			var tempDom = $('<tr class="">'+
								'<td class="file-name">'+ fileName + '</td>'+
								'<td class="upload-progress">100%</td>'+
								'<th class="delete" onclick="deleteFile($(this),true)"></th>'+
							'</tr>'); 
            $('.file-list').append(tempDom);
            $('.loading').hide();
        	
        	/*var fileName = data.files[0].name;
            var fileNameList = $('.file-list .file-name');
            var length = fileNameList.size();
            for(var i = 0; i<length; i++){
            	if(fileName == fileNameList.eq(i).text()){
            		$('.file-list .delete').eq(i).removeClass('hide');
                    isUploadingArr[i].isUploading = false;
            		break;
            	}
            }*/
        },
        progress: function (e, data) {
        	var fileName = data.files[0].name;
            var fileNameList = $('.file-list .file-name');
            var length = fileNameList.size();
            var progress = parseInt(data.loaded / data.total * 100, 10);
            for(var i = 0; i<length; i++){
            	if(fileName == fileNameList.eq(i).text()){
            		$('.file-list .upload-progress').eq(i).text(progress+'%');
            		break;
            	}
            }
        },
        fail: function(e, data){
        	console.log(data.files[0].name);
        	var fileName = data.files[0].name;
            var fileNameList = $('.file-list .file-name');
            var length = fileNameList.size();
            alert('网络异常,'+fileName+'上传失败');
            for(var i = 0; i<length; i++){
            	if(fileName == fileNameList.eq(i).text()){
            		deleteFile($('.file-list .delete').eq(i),false);
            		break;
            	}
            }
        }
    });
});
