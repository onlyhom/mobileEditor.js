
$.fn.extend({
    _opt: {
        placeholader: '请输入文章正文内容',
        validHtml: [],
        limitSize: 10,
        showServer: false
    },
    artEditor: function (options) {
        var _this = this,
            styles = {
                "-webkit-user-select": "text",
                "user-select": "text",
                "overflow-y": "auto",
                "text-break": "brak-all",
                "outline": "none",
                "cursor": "text"
            };
        $(this).css(styles).attr("contenteditable", true);
        _this._opt = $.extend(_this._opt, options);
        try {
            $(_this._opt.imgTar).on('change', function (e) {
                var file = e.target.files[0];
                var reg = /(\.|\/)(gif|jpe?g|png)$/i;
                if(!reg.test(file.name)){
                    alert('文本内只能插入图片,其他文件请选择附件形式插入');
                    return false;
                }
                e.target.value = '';
                if (Math.ceil(file.size / 1024 / 1024) > _this._opt.limitSize) {
                    layer.msg('文件太大');
                    return;
                }
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function (f) {
                    var data = f.target.result,
                        img = new Image();
                    img.src = f.target.result;

                    //if(_this._opt.compressSize && Math.ceil(file.size / 1024 / 1024) > _this._opt.compressSize) {
                        // 解决Firefox读取不到图片高、宽
                        //setTimeout(function() {
                            //图片压缩
                            //data = _this.compressHandler(img);
                        //}, 10);
                    //}

                    if (_this._opt.showServer) {
                        //iOS设备 需进行旋转
                        if (_this.isIos()) {
                            data = _this._canvasResize(data);
                            //在_canvasResize 已有upload步骤
                        }else{
                            _this.upload(data);
                        }

                        //return;
                    }
                   /* var image = '<img src="' + data + '" style="max-width:100%;" />';
                    _this.insertImage(image);*/
                };
            });
            _this.placeholderHandler();
            _this.pasteHandler();
        } catch (e) {
            console.log(e);
        }
        if (_this._opt.formInputId && $('#' + _this._opt.formInputId)[0]) {
            $(_this).on('input', function () {
                $('#' + _this._opt.formInputId).val(_this.getValue());
            });
        }

        $(this).on('input click', function() {
            //console.log('range改变');
            setTimeout(function() {
                var selection = window.getSelection ? window.getSelection() : document.selection;
                _this.range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
            },10);
            return false;
        });

        if (!/firefox/.test(navigator.userAgent.toLowerCase()) && this._opt.breaks) {
            $(this).keydown(function(e) {
                $(this).scrollTop( $(this)[0].scrollHeight );
                if (e.keyCode === 13) {
                    document.execCommand('insertHTML', false, '<br/><br/>');
                    return false;
                }
            });
        }

        $(_this._opt.linkTar).on('click',function(){
            var linkText = $('#link-text').val();
            var linkUrl = $('#link-url').val();
            var isNewWindow = $('#open-new-window').hasClass('on');
            var regUrl = new RegExp();
            regUrl.compile("[A-Za-z0-9-_]+\\.[A-Za-z0-9-_%&\?\/.=]+$");
            if( linkText == '' ){
                alert('文本内容不得为空');
                return false;
            }else if( linkUrl =='' ){
                alert('链接地址不得为空');
                return false;
            }else if(!regUrl.test(linkUrl)){
                alert('请输入合法的链接地址');
                return false;
            }
            _this.insertLink(linkText, linkUrl, isNewWindow);
        });

    },
    compressHandler: function(img) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext('2d');
        var tCanvas = document.createElement("canvas");
        var tctx = tCanvas.getContext("2d");
        var initSize = img.src.length;
        var width = img.width;
        var height = img.height;
        var ratio;
        if ((ratio = width * height / 4000000) > 1) {
            ratio = Math.sqrt(ratio);
            width /= ratio;
            height /= ratio;
        } else {
            ratio = 1;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        var count;
        if ((count = width * height / 1000000) > 1) {
            count = ~~(Math.sqrt(count) + 1);
            var nw = ~~(width / count);
            var nh = ~~(height / count);
            tCanvas.width = nw;
            tCanvas.height = nh;
            for (var i = 0; i < count; i++) {
                for (var j = 0; j < count; j++) {
                    tctx.drawImage(img, i * nw * ratio, j * nh * ratio, nw * ratio, nh * ratio, 0, 0, nw, nh);
                    ctx.drawImage(tCanvas, i * nw, j * nh, nw, nh);
                }
            }
        } else {
            ctx.drawImage(img, 0, 0, width, height);
        }
        var ndata = canvas.toDataURL('image/jpeg', 0.5);
        tCanvas.width = tCanvas.height = canvas.width = canvas.height = 0;
        return ndata;
    },
    upload: function (data) {
        $('.loading').show();
        var _this = this, filed = _this._opt.uploadField || 'uploadfile';
        var postData = $.extend(_this._opt.data, {});
        postData[filed] = data;
        var type = data.substring(data.indexOf('/')+1,data.indexOf(';'));
        var blob = _this.dataURItoBlob(data); // 上一步中的函数
        var canvas = document.createElement('canvas');
        var dataURL = canvas.toDataURL('image/jpeg', 0.5);
        var fd = new FormData(document.forms[0]);
        fd.append("file", blob, type);
        
        
        $.ajax({
            url: _this._opt.uploadUrl,
            processData: false, // 必须
            contentType: false, // 必须
            dataType:'json',
            type: 'post',
            data: fd,
            cache: false,
        })
        .then(function (res) {
               _this._opt.uploadSuccess(res);
               var url = res.url;
                if (url) {
                    var img = '<img src="' + url + '" />';
                    //console.log(img);
                    _this.insertImage(img);
                } else {
                    console.log('地址为空啊!大兄弟', url)
                }
                $('.loading').hide();
            }, 
            function (error) {
                _this._opt.uploadError(error.status,error);
                $('.loading').hide();
            })
    },
    insertLink:function(linkText, linkUrl, isNewWindow){
        $(this).focus();
        var selection = window.getSelection ? window.getSelection() : document.selection;
        var range;
        if(this.range) {
            range = this.range;
            this.range = null;
        } else {
            range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
        }

        var reg = /(?=.*http:\/\/|https:\/\/)^.*$/;
        if(!reg.test(linkUrl)){
            linkUrl = 'http://'+ linkUrl;
        }
        var string = '<a';
        string += ' href="'+linkUrl+'"';
        isNewWindow ? string += 'target="_blank">': string += '>';
        string += linkText + '</a>';

        if(range.startOffset == 0){
            $(this).append(string + '&nbsp;');
            //处理光标
            var editor = document.getElementById('editor');
            range =  document.createRange();
            range.setStart(editor, editor.childNodes.length);
            range.setEnd(editor, editor.childNodes.length);
        }else{
            range.collapse(false);
            var domLink = range.createContextualFragment(string + '&nbsp;');
            var hasLastChild = domLink.lastChild;
            while (hasLastChild && hasLastChild.nodeName.toLowerCase() == "br" && hasLastChild.previousSibling && hasLastChild.previousSibling.nodeName.toLowerCase() == "br") {
                var e = hasLastChild;
                hasLastChild = hasLastChild.previousSibling;
                hasR.removeChild(e);
            }
            range.insertNode(domLink);
            if(hasLastChild){
                range.setEndAfter(hasLastChild);
                range.setStartAfter(hasLastChild); 
            }
        }
        selection.removeAllRanges();
        selection.addRange(range);
        
        if (this._opt.formInputId && $('#' + this._opt.formInputId)[0]) {
            $('#' + this._opt.formInputId).val(this.getValue());
        }
        $('.pop').removeClass('pop-show');
        $('#link-text').val('');
        $('#link-url').val('');
        $(this).scrollTop($(this)[0].scrollHeight);
    },
    insertImage: function (src) {
        $(this).focus();
        var selection = window.getSelection ? window.getSelection() : document.selection;
        var range;
        if(this.range) {
            range = this.range;
            this.range = null;
        } else {
            range = selection.createRange ? selection.createRange() : selection.getRangeAt(0);
        }
        if (!window.getSelection) {
            range.pasteHTML(src);
            range.collapse(false);
            range.select();
        } else {

            if(range.startOffset == 0){
                $(this).append(src + '<br/>');
                //处理光标
                var editor = document.getElementById('editor');
                range =  document.createRange();
                range.setStart(editor, editor.childNodes.length);
                range.setEnd(editor, editor.childNodes.length);
            }else{
                range.collapse(false);
                var hasR = range.createContextualFragment(src);
                var hasLastChild = hasR.lastChild;
                while (hasLastChild && hasLastChild.nodeName.toLowerCase() == "br" && hasLastChild.previousSibling && hasLastChild.previousSibling.nodeName.toLowerCase() == "br") {
                    var e = hasLastChild;
                    hasLastChild = hasLastChild.previousSibling;
                    hasR.removeChild(e);
                }
                range.insertNode(range.createContextualFragment("<br/>"));
                range.insertNode(hasR);
                if (hasLastChild) {
                    range.setEndAfter(hasLastChild);
                    range.setStartAfter(hasLastChild);
                }
            }
            selection.removeAllRanges();
            selection.addRange(range);
        }
        if (this._opt.formInputId && $('#' + this._opt.formInputId)[0]) {
            $('#' + this._opt.formInputId).val(this.getValue());
        }
        $(this).scrollTop($(this)[0].scrollHeight);
    },
    pasteHandler: function () {
        var _this = this;
        $(this).on("paste", function (e) {
            console.log(e.clipboardData.items);
            var content = $(this).html();
            console.log(content);
            valiHTML = _this._opt.validHtml;
            content = content.replace(/_moz_dirty=""/gi, "").replace(/\[/g, "[[-").replace(/\]/g, "-]]").replace(/<\/ ?tr[^>]*>/gi, "[br]").replace(/<\/ ?td[^>]*>/gi, "&nbsp;&nbsp;").replace(/<(ul|dl|ol)[^>]*>/gi, "[br]").replace(/<(li|dd)[^>]*>/gi, "[br]").replace(/<p [^>]*>/gi, "[br]").replace(new RegExp("<(/?(?:" + valiHTML.join("|") + ")[^>]*)>", "gi"), "[$1]").replace(new RegExp('<span([^>]*class="?at"?[^>]*)>', "gi"), "[span$1]").replace(/<[^>]*>/g, "").replace(/\[\[\-/g, "[").replace(/\-\]\]/g, "]").replace(new RegExp("\\[(/?(?:" + valiHTML.join("|") + "|img|span)[^\\]]*)\\]", "gi"), "<$1>");
            if (!/firefox/.test(navigator.userAgent.toLowerCase())) {
                content = content.replace(/\r?\n/gi, "<br>");
            }
            $(this).html(content);
        });
    },
    placeholderHandler: function () {
        var _this = this;
        var imgReg = /<img\s*([\w]+=(\"|\')([^\"\']*)(\"|\')\s*)*\/?>/;
        $(this).on('focus', function () {
            if ($.trim($(this).text()) === _this._opt.placeholader) {
                $(this).html('');
            }
        })
            .on('blur', function () {
                if (!$.trim($(this).text()) && !imgReg.test($(this).html())) {
                    $(this).html('<div class="placeholader" style="pointer-events: none;">' + _this._opt.placeholader + '</div>');
                }
            });

        if (!$.trim($(this).text()) && !imgReg.test($(this).html())) {
            $(this).html('<div class="placeholader" style="pointer-events: none;">' + _this._opt.placeholader + '</div>');
        }
    },
    getValue: function () {
        return $(this).html();
    },
    setValue: function (str) {
        $(this).html(str);
    },
    dataURItoBlob: function (base64Data) {
    	var byteString;
    	if (base64Data.split(',')[0].indexOf('base64') >= 0)
    	byteString = atob(base64Data.split(',')[1]);
    	else
    	byteString = unescape(base64Data.split(',')[1]);
    	var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
    	var ia = new Uint8Array(byteString.length);
    	for (var i = 0; i < byteString.length; i++) {
    	ia[i] = byteString.charCodeAt(i);
    	}
    	return new Blob([ia], {type:mimeString});
    },
    isIos: function() {
        var e = navigator.userAgent;
        return e.match(/(iPad).*OS\s([\d_]+)/) || e.match(/(iPod)(.*OS\s([\d_]+))?/) || e.match(/(iPhone\sOS)\s([\d_]+)/)
    },
    _rotateImg: function (img, direction, canvas) {
        /**
         * 旋转图片
         * @param  {img}
         * @param  {direction}
         * @param  {canvas}
         * @return {[type]}
         */

        //最小与最大旋转方向，图片旋转4次后回到原方向    
        var min_step = 0;
        var max_step = 3;  
        if (img == null) return;
        //img的高度和宽度不能在img元素隐藏后获取，否则会出错    
        var height = img.height;
        var width = img.width;    
        var step = 2;
        if (step == null) {
            step = min_step;
        }
        if (direction == 'right') {
            step++;
            //旋转到原位置，即超过最大值    
            step > max_step && (step = min_step);

        } else if(direction == 'left') {
            step--;
            step < min_step && (step = max_step);

        } else{
            step = 2;
        }

        //旋转角度以弧度值为参数    
        var degree = step * 90 * Math.PI / 180;
        var ctx = canvas.getContext('2d');
        switch (step) {
            case 0:
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0);
                break;
            case 1:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(degree);
                ctx.drawImage(img, 0, -height);
                break;
            case 2:
                canvas.width = width;
                canvas.height = height;
                ctx.rotate(degree);
                ctx.drawImage(img, -width, -height);
                break;
            case 3:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(degree);
                ctx.drawImage(img, -width, 0);
                break;
            case 4:
                canvas.width = width;
                canvas.height = height;
                ctx.rotate(degree);
                ctx.drawImage(img, 0, 0);
                break;
        }
    },
    _canvasResize: function (result, upload) {
        /**
         * @param  {dataurl}
         * @param  {upload function}
         * @return {[type]}
         */
      
        var _this = this;
        var image = new Image()
        base64 = null;
        image.src = result;
        image.onload = function() {
            var Orientation = "";

            EXIF.getData(this, function() {
                Orientation = EXIF.getTag(this, 'Orientation');
            });
            var expectWidth = this.naturalWidth;
            var expectHeight = this.naturalHeight;

            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = expectWidth;
            canvas.height = expectHeight;
            ctx.drawImage(this, 0, 0, expectWidth, expectHeight);

            //等于1不需要旋转
            if (Orientation != "" && Orientation != 1) {
                //alert(Orientation);
                switch (Orientation) {
                    case 6: //需要顺时针（向左）90度旋转  
                        _this._rotateImg(this, 'left', canvas);
                        break;
                    case 8: //需要逆时针（向右）90度旋转  
                        _this._rotateImg(this, 'right', canvas);
                        break;
                    case 3: //需要180度旋转  
                        _this._rotateImg(this, 'overturn', canvas);
                        break;
                }
            }
            base64 = canvas.toDataURL("image/jpeg", 0.5);
            _this.upload(base64);
        }
    }
});
