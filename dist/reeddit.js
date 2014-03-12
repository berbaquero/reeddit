!function(win){function $id(id){return doc.getElementById(id)}function $query(query){return doc.querySelector(query)}function checkWideScreen(){return win.matchMedia("(min-width: 1000px)").matches}function checkLargeScreen(){return win.matchMedia("(min-width: 490px)").matches}function goToCommentFromHash(){var match=location.hash.match(/(#comments:)((?:[a-zA-Z0-9]*))/);if(match&&match[2]){var id=match[2];C.Comments.show(id)}}function checkImageLink(url){var matching=url.match(/\.(svg|jpe?g|png|gif)(?:[?#].*)?$|(?:imgur\.com|www.quickmeme\.com\/meme|qkme\.me)\/([^?#\/.]*)(?:[?#].*)?(?:\/)?$/);return matching?matching[1]?url:matching[2]?"imgur"===matching[0].slice(0,5)?"http://imgur.com/"+matching[2]+".jpg":"http://i.qkme.me/"+matching[2]+".jpg":null:""}function setEditingSubs(editing){if(editingSubs=editing,isWideScreen){var refreshBtn=$("#main-footer .footer-refresh");refreshBtn.css("display",editing?"none":"")}}function doByCurrentSelection(caseSub,caseChannel){switch(M.currentSelection.type){case selection.sub:caseSub();break;case selection.channel:caseChannel()}}function goToComments(id){location.hash="#comments:"+id}function refreshCurrentStream(){editingSubs||doByCurrentSelection(function(){C.Posts.load(M.currentSelection.name.toUpperCase()==="frontPage".toUpperCase()?urlInit+"r/"+M.Subreddits.getAllString()+"/":urlInit+"r/"+M.currentSelection.name+"/")},function(){C.Channels.loadPosts(M.Channels.getByName(M.currentSelection.name))})}function createBackup(){updateBackup?V.Actions.showModal(T.exportData,function(){var files={},content='{"channels": '+store.getItem("channels")+', "subreddits": '+store.getItem("subreeddits")+"}";files["reedditdata.json"]={content:content},$.ajax({url:gists.url,type:"POST",data:JSON.stringify({description:"Reeddit User Data","public":!0,files:files}),headers:{"Content-Type":"application/json; charset=UTF-8"},success:function(response){var resp=JSON.parse(response);$id("btn-save-dbx").style.display="block",gists.fileURL=resp.files["reedditdata.json"].raw_url,updateBackup=0},error:function(){$("#btn-save-dbx").remove(),$(".move-data-exp").append("<p class='msg-error'>Oh oh. Error creating your backup file. Retry later.</p>"),V.Actions.removeModal()}})}):gists.fileURL&&V.Actions.showModal(T.exportData,function(){$id("btn-save-dbx").style.display="block"})}function chooseFromDropbox(){Dropbox.choose({success:function(file){$.ajax({url:file[0].link,success:function(data){try{var refresh=!1;"string"==typeof data&&(data=JSON.parse(data)),data.subreddits&&(refresh=!0,store.setItem("subreeddits",JSON.stringify(data.subreddits))),data.channels&&(refresh=!0,store.setItem("channels",JSON.stringify(data.channels))),refresh&&win.location.reload()}catch(e){alert("Oops! Wrong file, maybe? - Try choosing another one.")}}})},linkType:"direct",extensions:[".json"]})}var subreddits,currentThread,isiPad,scrollFix,doc=win.document,body=doc.body,editingSubs=!1,urlInit="http://www.reddit.com/",urlEnd=".json?jsonp=?",urlLimitEnd=".json?limit=30&jsonp=?",loadedLinks={},replies={},showingMenu=!1,store=win.fluid?allCookies:win.localStorage,esModal=!1,loadingComments=!1,loadingLinks=!1,isWideScreen=checkWideScreen(),isLargeScreen=checkLargeScreen(),currentSortingChoice="hot",mnml=!1,updateBackup=1,gists={url:"https://api.github.com/gists",fileURL:""},move={left:1,right:2},view={main:1,comments:2},selection={sub:1,channel:2},css={showView:"show-view",showMenu:"show-menu",mnml:"mnml",hide:"hide"},currentView=view.main,defaultSubs=["frontPage","pics","IAmA","AskReddit","worldNews","todayilearned","technology","science","reactiongifs","books","explainLikeImFive","videos","AdviceAnimals","funny","aww","earthporn"],defaultChannel={name:"Media",subs:["movies","television","music","games"]},T={Posts:"{{#children}}<article class='link-wrap'><a class='link' href='{{data.url}}' data-id='{{data.id}}' target='_blank'><div class='link-thumb'><div style='background-image: url({{data.thumbnail}})'></div></div><div class='link-info'><p class='link-title'>{{data.title}}</p><p class='link-domain'>{{data.domain}}</p><p class='link-sub'>{{data.subreddit}}</p>{{#data.over_18}}<p class='link-nsfw'>NSFW</p>{{/data.over_18}}</div></a><div class='to-comments' data-id='{{data.id}}'><div class='comments-icon'></div></div></article>{{/children}}<div class='list-button'><span id='more-links'>More</span></div><div id='main-overflow'></div>",Subreddits:{list:"{{#.}}<li data-name='{{.}}'><p class='sub'>{{.}}</p></li>{{/.}}",toRemoveList:"<ul class='remove-list'>{{#.}}<div class='item-to-remove sub-to-remove' data-name='{{.}}'><p>{{.}}</p><div data-name='{{.}}'></div></div>{{/.}}</ul>",toAddList:"{{#children}}<div class='subreddit'><div><p class='subreddit-title'>{{data.display_name}}</p><p class='subreddit-desc'>{{data.public_description}}</p></div><div class='btn-add-sub'><div></div></div></div>{{/children}}"},Channels:{toRemoveList:"<p id='remove-title'>Channels</p><ul class='remove-list'>{{#.}}<div class='item-to-remove channel-to-remove' data-title='{{name}}'><p>{{name}}</p><div data-title='{{name}}'></div></div>{{/.}}</ul>",single:'<li><div class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>',list:'{{#.}}<li><div class="channel" data-title="{{name}}"><p>{{name}}</p><div>{{#subs}}<p>{{.}}</p>{{/subs}}</div></div></li>{{/.}}'},linkSummary:"<section id='link-summary'><a href='{{url}}' target='_blank'><p id='summary-title'>{{title}}</p><p id='summary-domain'>{{domain}}</p>{{#over_18}}<span class='link-nsfw summary-nsfw'>NSFW</span>{{/over_18}}</a><div id='summary-footer'><p id='summary-author'>by {{author}}</p><a class='btn-general' id='share-tw' target='_blank' href='https://twitter.com/intent/tweet?text=\"{{encodedTitle}}\" —&url={{url}}&via=ReedditApp&related=ReedditApp'>Tweet</a></div><div id='summary-extra'><p id='summary-sub'>{{subreddit}}</p><p id='summary-time'></p><a id='summary-comment-num' title='See comments on reddit.com' href='http://reddit.com{{link}}' target='_blank'>{{num_comments}} comments</a></section>",botonAgregarSubManual:"<div class='top-buttons'><div id='btn-sub-man'>Insert Manually</div><div id='btn-add-channel'>Create Channel</div></div>",formAgregarSubManual:'<div class="new-form" id="form-new-sub"><div class="form-left-corner"><div class="btn-general" id="btn-add-new-sub">Add Subreddit</div></div><div class="close-form">close</div><form><input type="text" id="txt-new-sub" placeholder="New subreddit name" /></form></div>',formAddNewChannel:'<div class="new-form" id="form-new-channel"><div class="form-left-corner"><div class="btn-general" id="btn-add-new-channel">Add Channel</div></div><div class="close-form">close</div><input type="text" id="txt-channel" placeholder="Channel name" /><div id="subs-for-channel"><input type="text" placeholder="Subreddit 1" /><input type="text" placeholder="Subreddit 2" /><input type="text" placeholder="Subreddit 3" /></div><div id="btn-add-another-sub">+ another subreddit</div></div>',botonCargarMasSubs:"<div class='list-button'><span id='more-subs'>More</span></div>",noLink:"No Post Selected",about:"<div class='new-form about-reeddit'><div class='close-form'>close</div><ul><li><a href='http://reedditapp.com/about' target='_blank'>Reeddit Homepage</a></li><li><a href='https://github.com/berbaquero/reeddit' target='_blank'>GitHub Project</a></li></ul><p>v1.8.0</p><p><a href='https://twitter.com/reedditapp'>@ReedditApp</a></p><p>Built by <a href='http://berbaquero.com' target='_blank'>Bernardo Baquero Stand</a></p></div>",exportData:"<div class='new-form move-data'><div class='close-form'>close</div><div class='move-data-exp'><h3>Export Data</h3><p>You can back-up your local subscriptions and then import them to any other Reeddit instance, or just restore them.</p><div class='btn-general' id='btn-save-dbx'>Save to Dropbox</div></div></div>",importData:"<div class='new-form move-data'><div class='close-form'>close</div><div class='move-data-imp'><h3>Import Data</h3><p>Load the subscriptions from another Reeddit instance.</p><p>Once you choose the reeddit data file, Reeddit will refresh with the imported data.</p><div class='btn-general' id='btn-dbx-imp'>Import from Dropbox</div></div></div>"},M={Posts:{list:{},setList:function(posts){for(var i=0;i<posts.children.length;i++){var post=posts.children[i];M.Posts.list[post.data.id]?(M.Posts.list[post.data.id].num_comments=post.data.num_comments,M.Posts.list[post.data.id].created_utc=post.data.created_utc):M.Posts.list[post.data.id]={title:post.data.title,encodedTitle:encodeURI(post.data.title),selftext:post.data.selftext,created_utc:post.data.created_utc,domain:post.data.domain,subreddit:post.data.subreddit,num_comments:post.data.num_comments,url:post.data.url,self:post.data.is_self,link:post.data.permalink,author:post.data.author,over_18:post.data.over_18}}},idLast:""},Subreddits:{list:[],add:function(sub){M.Subreddits.listHasSub(sub)||(M.Subreddits.list.push(sub),store.setItem("subreeddits",JSON.stringify(M.Subreddits.list)),updateBackup=1)},setList:function(subs){M.Subreddits.list=subs,store.setItem("subreeddits",JSON.stringify(M.Subreddits.list)),updateBackup=1},remove:function(sub){var idx=M.Subreddits.list.indexOf(sub);M.Subreddits.list.splice(idx,1),store.setItem("subreeddits",JSON.stringify(M.Subreddits.list)),updateBackup=1},listHasSub:function(sub){if(M.Subreddits.list){var i=M.Subreddits.list.indexOf(sub);return i>-1}return!1},getAllString:function(){for(var allSubs="",i=0;i<M.Subreddits.list.length;i++){var sub=M.Subreddits.list[i];sub.toUpperCase()!=="frontPage".toUpperCase()&&(allSubs+=sub+"+")}return allSubs.substring(0,allSubs.length-1)},idLast:""},Channels:{list:[],getURL:function(channel){return 1===channel.subs.length?"r/"+channel.subs[0]+"+"+channel.subs[0]:"r/"+channel.subs.join("+")},add:function(channel){M.Channels.list.push(channel),store.setItem("channels",JSON.stringify(M.Channels.list)),updateBackup=1},remove:function(name){for(var j=0;j<M.Channels.list.length;j++)if(M.Channels.list[j].name===name){M.Channels.list.splice(j,1);break}store.setItem("channels",JSON.stringify(M.Channels.list)),updateBackup=1},getByName:function(name){for(var foundChannel,i=0;i<M.Channels.list.length;i++)if(M.Channels.list[i].name.toLowerCase()===name.toLowerCase()){foundChannel=M.Channels.list[i];break}return foundChannel}},currentSelection:{loadSaved:function(){var loadedSelection=store.getItem("currentSelection");loadedSelection&&(loadedSelection=JSON.parse(loadedSelection)),M.currentSelection.name=loadedSelection?loadedSelection.name:"frontPage",M.currentSelection.type=loadedSelection?loadedSelection.type:selection.sub},setSubreddit:function(sub){M.currentSelection.name=sub,M.currentSelection.type=selection.sub,store.setItem("currentSelection",JSON.stringify(M.currentSelection))},setChannel:function(channel){M.currentSelection.name=channel.name,M.currentSelection.type=selection.channel,store.setItem("currentSelection",JSON.stringify(M.currentSelection))}}},V={mainWrap:$("#main-wrap"),detailWrap:$("#detail-wrap"),mainView:$(".main-view"),detailView:$(".detail-view"),subtitle:$("#main-title"),subtitleText:$("#sub-title"),headerSection:$("#title-head"),title:$("#title"),headerIcon:$("#header-icon"),btnNavBack:$("#nav-back"),footerSub:$("#footer-sub"),footerPost:$("#footer-post"),Channels:{menuContainer:$("#channels"),add:function(channel){V.Channels.menuContainer.append(Mustache.to_html(T.Channels.single,channel))},loadList:function(){V.Channels.menuContainer.html(Mustache.to_html(T.Channels.list,M.Channels.list))},remove:function(name){$('.channel[data-title="'+name+'"]').parent().remove(),$('.channel-to-remove[data-title="'+name+'"]').remove()}},Subreddits:{listContainer:$("#subs"),insert:function(subs,active){var subsList=V.Subreddits.listContainer;subs instanceof Array?subsList.append(Mustache.to_html(T.Subreddits.list,subs)):M.Subreddits.listHasSub(subs)||(subsList.append($("<li/>").attr("data-name",subs).append($("<p/>").addClass("sub").addClass(active?"sub-active":"").text(subs))),M.Subreddits.add(subs))},remove:function(sub){$(".sub-to-remove[data-name='"+sub+"']").remove(),$("#subs > li[data-name='"+sub+"']").remove()},cleanSelected:function(){$(".sub.sub-active").removeClass("sub-active"),$(".channel.channel-active").removeClass("channel-active")}},Posts:{show:function(links,paging){var linksCount=links.children.length,main=V.mainWrap;if(paging?$(".loader").remove():isDesktop?main.empty():main.empty().removeClass("anim-reveal").addClass("invisible"),0===linksCount){var message=$query(".loader");message?(message.innerText="No Links available.",message.classList.add("loader-error"),main.append('<div id="#main-overflow"></div>')):main.prepend('<div class="loader loader-error">No Links available.</div><div id="main-overflow"></div>')}else{main.append(Mustache.to_html(T.Posts,links));for(var thumbs=$(".link-thumb > div"),bgImg="background-image: ",i=0;i<thumbs.length;i++){var thumb=$(thumbs[i]),bg=thumb.attr("style");(bg===bgImg+"url()"||bg===bgImg+"url(default)"||bg===bgImg+"url(nsfw)"||bg===bgImg+"url(self)")&&thumb.parent().remove()}}30>linksCount&&$("more-links").parent().remove(),isDesktop||V.Misc.scrollFixLinks(),paging||V.Anims.reveal()}},Actions:{setSubTitle:function(title){V.subtitleText.text(title),V.footerSub.text(title)},backToMainView:function(){V.btnNavBack.addClass("invisible"),V.subtitle.removeClass("invisible"),V.headerSection.empty().append(V.headerIcon),V.Anims.slideFromLeft()},moveMenu:function(direction){direction===move.left&&(V.mainView.removeClass(css.showMenu),setTimeout(function(){showingMenu=!1})),direction===move.right&&(V.mainView.addClass(css.showMenu),setTimeout(function(){showingMenu=!0}))},loadForAdding:function(){isLargeScreen||V.Actions.moveMenu(move.left),currentView===view.comments&&V.Actions.backToMainView(),setTimeout(function(){V.mainWrap[0].scrollTop=0;var main=V.mainWrap;subreddits?main.empty().append(T.botonAgregarSubManual).append(subreddits).append(T.botonCargarMasSubs):(main.prepend("<div class='loader'></div>").prepend(T.botonAgregarSubManual),$.ajax({url:urlInit+"reddits/.json?limit=50&jsonp=?",dataType:"jsonp",success:function(list){M.Subreddits.idLast=list.data.after,subreddits=Mustache.to_html(T.Subreddits.toAddList,list.data),main.empty().append(T.botonAgregarSubManual).append(subreddits).append(T.botonCargarMasSubs)},error:function(){$(".loader").addClass("loader-error").text("Error loading subreddits.")}})),loadingLinks=!1},isLargeScreen?1:301),V.Subreddits.cleanSelected(),V.Actions.setSubTitle("+ Subreddits"),setEditingSubs(!0)},loadForRemoving:function(){isLargeScreen||V.Actions.moveMenu(move.left),currentView===view.comments&&V.Actions.backToMainView(),setTimeout(function(){V.mainWrap[0].scrollTop=0;var htmlSubs=Mustache.to_html(T.Subreddits.toRemoveList,M.Subreddits.list),htmlChannels="";M.Channels.list&&M.Channels.list.length>0&&(htmlChannels=Mustache.to_html(T.Channels.toRemoveList,M.Channels.list));var html='<div id="remove-wrap">'+htmlSubs+htmlChannels+"</div>";setTimeout(function(){V.mainWrap.html(html)},10),V.Subreddits.cleanSelected(),loadingLinks=!1},isLargeScreen?1:301),V.Actions.setSubTitle("- Subreddits"),setEditingSubs(!0)},showModal:function(template,callback){var delay=1;!isLargeScreen&&showingMenu&&(V.Actions.moveMenu(move.left),delay=301),setTimeout(function(){if(!esModal){var modal=$("<div/>").attr("id","modal");$("body").append(modal).append(template),esModal=!0,setTimeout(function(){modal.css("opacity",1)},1),callback&&callback()}},delay)},removeModal:function(){var modal=$("#modal");modal.css("opacity",""),$(".close-form").remove(),$(".new-form").remove(),esModal=!1,setTimeout(function(){modal.remove()},301)},switchMnml:function(save,mode){mnml="undefined"==typeof mode?!mnml:mode;var bntMnml=$("#mnml");mnml?(body.classList.add(css.mnml),bntMnml.text("Mnml: on")):(body.classList.remove(css.mnml),bntMnml.text("Mnml: off")),save&&store.setItem("mnml",mnml)},setDetailFooter:function(title){V.footerPost.text(title?title:T.noLink);var btns=$("#detail-footer .btn-footer");title?btns.removeClass(css.hide):btns.addClass(css.hide)}},Comments:{setRest:function(id,refresh){var postTitle=M.Posts.list[id].title;refresh||V.Actions.setDetailFooter(postTitle),refresh||currentView===view.comments||V.Anims.slideFromRight(),isWideScreen&&($(".link.link-selected").removeClass("link-selected"),$('.link[data-id="'+id+'"]').addClass("link-selected")),V.headerSection.empty().append(V.title),V.title.text(postTitle),V.subtitle.addClass("invisible")},showLoadError:function(loader){loadingComments=!1;var error="Error loading comments. Refresh to try again.";isWideScreen?loader.addClass("loader-error").html(error+'<div class="comments-button" id="wide-refresh">Refresh</div>'):loader.addClass("loader-error").text(error),isDesktop||(V.detailWrap.append($("<section/>")),V.Misc.scrollFixComments())}},Misc:{addLoader:function(elem){var loader=$("<div/>").addClass("loader");return elem.append(loader),loader},scrollFixComments:function(){var detailWrap=$query("#detail-wrap"),detailWrapHeight=detailWrap.offsetHeight,linkSummary=detailWrap.querySelector("section:first-child"),linkSummaryHeight=linkSummary.offsetHeight,selfText=detailWrap.querySelector("#selftext"),selfTextHeight=selfText?selfText.offsetHeight:0,imagePreview=detailWrap.querySelector(".image-preview"),imagePreviewHeight=imagePreview?imagePreview.offsetHeight:0,loader=detailWrap.querySelector(".loader"),loaderHeight=loader?loader.offsetHeight:0,minHeight=detailWrapHeight-linkSummaryHeight-selfTextHeight-imagePreviewHeight-loaderHeight+1;$("#detail-wrap > section + "+(selfTextHeight>0?"#selftext +":"")+(imagePreviewHeight>0?".image-preview +":"")+(loaderHeight>0?".loader +":"")+" section").css("min-height",minHeight)},scrollFixLinks:function(){for(var totalHeight=0,wraps=doc.querySelectorAll(".link-wrap"),w=0;w<wraps.length;w++)totalHeight+=wraps[w].offsetHeight;var containerHeight=body.offsetHeight,headerHeight=$query("header").offsetHeight,message=$query(".loader"),messageHeight=message?message.offsetHeight:0,listButton=$query(".list-button"),listButtonHeight=listButton?listButton.offsetHeight:0,minHeight=containerHeight-headerHeight-messageHeight-listButtonHeight;totalHeight>minHeight?$("#main-overflow").css("min-height",""):$("#main-overflow").css("min-height",minHeight-totalHeight+1)}},Anims:{slideFromLeft:function(){var show=css.showView;V.mainView.addClass(show),V.detailView.removeClass(show),currentView=view.main},slideFromRight:function(){var show=css.showView;V.mainView.removeClass(show),V.detailView.addClass(show),currentView=view.comments},reveal:function(){isDesktop?(V.mainWrap.addClass("anim-reveal"),setTimeout(function(){V.mainWrap.removeClass("anim-reveal")},700)):setTimeout(function(){V.mainWrap.removeClass("invisible").addClass("anim-reveal")},0)}}},C={Posts:{load:function(baseUrl,paging){if(!loadingLinks){loadingLinks=!0,loadingComments=!1,setEditingSubs(!1);var main=V.mainWrap;paging?($("#more-links").parent().remove(),main.append("<div class='loader'></div>")):(V.mainWrap[0].scrollTop=0,setTimeout(function(){main.prepend("<div class='loader'></div>")},showingMenu?301:1),paging=""),$.ajax({dataType:"jsonp",url:baseUrl+C.Sorting.get()+urlLimitEnd+paging,success:function(result){C.Posts.show(result,paging)},error:function(){loadingLinks=!1,$(".loader").addClass("loader-error").text("Error loading links. Refresh to try again.")}})}},loadFromManualInput:function(loadedLinks){C.Posts.show(loadedLinks),setEditingSubs(!1)},show:function(result,paging){var links=result.data;loadingLinks=!1,M.Posts.idLast=links.after,V.Posts.show(links,paging),M.Posts.setList(links)}},Comments:{load:function(data,baseElement,idParent){for(var now=(new Date).getTime(),converter=new Markdown.Converter,com=$("<section/>"),i=0;i<data.length;i++){var c=data[i];if("t1"===c.kind){var html=converter.makeHtml(c.data.body),isPoster=M.Posts.list[currentThread].author===c.data.author,permalink="http://reddit.com"+M.Posts.list[currentThread].link+c.data.id,commentLink={href:permalink,target:"_blank",title:"See this comment on reddit.com"},comment=$("<div/>").addClass("comment-wrap").append($("<div/>").append($("<div/>").addClass("comment-data").append($("<div/>").addClass(isPoster?"comment-poster":"comment-author").append($("<p/>").text(c.data.author))).append($("<div/>").addClass("comment-info").append($("<a/>").attr(commentLink).text(timeSince(now,c.data.created_utc))))).append($("<div/>").addClass("comment-body").html(html)));c.data.replies&&"more"!==c.data.replies.data.children[0].kind&&(comment.append($("<span/>").addClass("comments-button replies-button").attr("comment-id",c.data.id).text("See replies")),replies[c.data.id]=c.data.replies.data.children),com.append(comment)}}baseElement.append(com),idParent&&(loadedLinks[idParent]=com),$("#detail-wrap a").attr("target","_blank"),isDesktop||V.Misc.scrollFixComments()},show:function(id,refresh){if(M.Posts.list[id]){var delay=0;showingMenu&&(V.Actions.moveMenu(move.left),delay=301),setTimeout(function(){if(!loadingComments||!currentThread||currentThread!==id){loadingComments=!0,currentThread=id,V.btnNavBack.removeClass("invisible");var detail=V.detailWrap;if(detail.empty(),V.detailWrap[0].scrollTop=0,loadedLinks[id]&&!refresh)detail.append(M.Posts.list[id].summary),detail.append(loadedLinks[id]),C.Misc.updatePostSummary(M.Posts.list[id],id),loadingComments=!1;else{C.Misc.setPostSummary(M.Posts.list[id],id);var url="http://www.reddit.com"+M.Posts.list[id].link+urlEnd,loader=V.Misc.addLoader(detail);$.ajax({dataType:"jsonp",url:url,success:function(result){currentThread===id&&(C.Misc.updatePostSummary(result[0].data.children[0].data,id),loader.remove(),C.Comments.load(result[1].data.children,detail,id),loadingComments=!1)},error:function(){V.Comments.showLoadError(loader)}})}V.Comments.setRest(id,refresh)}},delay)}else{currentThread=id;var loader=V.Misc.addLoader(V.detailWrap);loadingComments=!0,$.ajax({dataType:"jsonp",url:urlInit+"comments/"+id+"/"+urlEnd,success:function(result){loader.remove(),loadingComments=!1,M.Posts.setList(result[0].data),C.Misc.setPostSummary(result[0].data.children[0].data,id),V.btnNavBack.removeClass("invisible"),V.Comments.setRest(id,refresh),C.Comments.load(result[1].data.children,V.detailWrap,id)},error:function(){V.Comments.showLoadError(loader)}})}}},Subreddits:{loadSaved:function(){var subs=store.getItem("subreeddits");subs&&(subs=JSON.parse(subs)),M.Subreddits.list=subs,M.Subreddits.list||M.Subreddits.setList(defaultSubs),V.Subreddits.insert(M.Subreddits.list)},loadPosts:function(sub){if(sub!==M.currentSelection.name||editingSubs){var url;url=sub.toUpperCase()==="frontPage".toUpperCase()?urlInit+"r/"+M.Subreddits.getAllString()+"/":urlInit+"r/"+sub+"/",C.Posts.load(url),C.currentSelection.setSubreddit(sub)}V.Actions.setSubTitle(sub)},remove:function(sub){M.Subreddits.remove(sub),V.Subreddits.remove(sub),M.currentSelection.type===selection.sub&&M.currentSelection.name===sub&&C.currentSelection.setSubreddit("frontPage")},addFromNewForm:function(){var txtSub=$id("txt-new-sub"),subName=txtSub.value;return subName?(V.Actions.removeModal(),void $.ajax({url:urlInit+"r/"+subName+"/"+C.Sorting.get()+urlLimitEnd,dataType:"jsonp",success:function(data){C.Posts.loadFromManualInput(data),V.Actions.setSubTitle(subName),V.Subreddits.cleanSelected(),C.currentSelection.setSubreddit(subName),V.Subreddits.insert(subName,!0)},error:function(){alert("Oh, the subreddit you entered is not valid...")}})):void txtSub.setAttribute("placeholder","Enter a subreddit title!")}},Channels:{add:function(channel){M.Channels.add(channel),V.Channels.add(channel)},loadSaved:function(){M.Channels.list=store.getItem("channels"),M.Channels.list=M.Channels.list?JSON.parse(M.Channels.list):[defaultChannel],V.Channels.loadList()},loadPosts:function(channel){C.Posts.load(urlInit+M.Channels.getURL(channel)+"/"),V.Actions.setSubTitle(channel.name),C.currentSelection.setChannel(channel)},remove:function(name){M.Channels.remove(name),V.Channels.remove(name),M.currentSelection.type===selection.channel&&M.currentSelection.name===name&&C.currentSelection.setSubreddit("frontPage")}},currentSelection:{setSubreddit:function(sub){M.currentSelection.setSubreddit(sub)},setChannel:function(channel){M.currentSelection.setChannel(channel)}},Sorting:{get:function(){return"hot"!==currentSortingChoice?currentSortingChoice+"/":""},change:function(sorting){if(currentSortingChoice=sorting,!editingSubs){var delay=1;showingMenu&&(V.Actions.moveMenu(move.left),delay=301),setTimeout(function(){refreshCurrentStream()},delay)}}},Misc:{setPostSummary:function(data,postID){var summaryHTML=Mustache.to_html(T.linkSummary,data),imageLink=checkImageLink(M.Posts.list[postID].url);if(imageLink&&(summaryHTML+="<img class='image-preview' src='"+imageLink+"' />"),data.selftext){var selfText;if(M.Posts.list[postID].selftextParsed)selfText=M.Posts.list[postID].selftext;else{var summaryConverter1=new Markdown.Converter;selfText=summaryConverter1.makeHtml(data.selftext),M.Posts.list[postID].selftext=selfText,M.Posts.list[postID].selftextParsed=!0}summaryHTML+="<section id='selftext'>"+selfText+"</section>"}V.detailWrap.append(summaryHTML),C.Misc.updatePostTime(data.created_utc),M.Posts.list[postID].summary=summaryHTML,V.footerPost.text(data.title)},updatePostSummary:function(data,postID){$id("summary-comment-num").innerText=data.num_comments+(1===data.num_comments?" comment":" comments"),C.Misc.updatePostTime(data.created_utc),M.Posts.list[postID].num_comments=data.num_comments,M.Posts.list[postID].created_utc=data.created_utc},updatePostTime:function(time){$id("summary-time").innerText=timeSince((new Date).getTime(),time)}}};$("body").on("submit","#form-new-sub form",function(e){e.preventDefault(),C.Subreddits.addFromNewForm()});var supportOrientation="undefined"!=typeof win.orientation,getScrollTop=function(){return win.pageYOffset||"CSS1Compat"===doc.compatMode&&doc.documentElement.scrollTop||body.scrollTop||0},scrollTop=function(){supportOrientation&&(body.style.height=screen.height+"px",setTimeout(function(){win.scrollTo(0,1);var top=getScrollTop();win.scrollTo(0,1===top?0:1),body.style.height=win.innerHeight+"px"},1))};tappable("#mnml",{onTap:function(){V.Actions.switchMnml(!0)}}),tappable("#btn-add-new-sub",{onTap:C.Subreddits.addFromNewForm}),tappable("#btn-add-new-channel",{onTap:function(e,target){var btn=$(target),txtChannelName=$("#txt-channel"),channelName=txtChannelName.val();if(!channelName)return void txtChannelName.attr("placeholder","Enter a Channel name!");for(var subreddits=[],subs=$("#subs-for-channel input"),i=0;i<subs.length;i++){var sub=$(subs[i]).val();sub&&subreddits.push(sub)}if(0===subreddits.length)return void(subs[0].placeholder="Enter at least one subreddit!");var savedChannel=M.Channels.getByName(channelName);if(savedChannel)return txtChannelName.val(""),void txtChannelName.attr("placeholder","'"+channelName+"' already exists.");var channel={};channel.name=channelName,channel.subs=subreddits,C.Channels.add(channel),btn.remove(),$(".form-left-corner").append("<p class='channel-added-msg'>'"+channel.name+"' added. Cool!</p>"),setTimeout(function(){V.Actions.removeModal()},1500)},activeClass:"btn-general-active"}),tappable("#btn-add-another-sub",{onTap:function(){var container=$("#subs-for-channel");container.append("<input type='text' placeholder='Extra subreddit'></input>"),container[0].scrollTop=container.height()},activeClass:"btn-general-active"}),tappable(".channel",{onTap:function(e,target){var channel=$(target),channelName=channel.data("title");V.Actions.moveMenu(move.left),(channelName!==M.currentSelection.name||editingSubs)&&(V.Subreddits.cleanSelected(),channel.addClass("channel-active"),currentView===view.comments&&V.Actions.backToMainView(),C.Channels.loadPosts(M.Channels.getByName(channelName)))},activeClassDelay:100,activeClass:"link-active"}),tappable(".replies-button",{onTap:function(e,target){var parent=$(target),commentID=parent.attr("comment-id"),comments=replies[commentID];C.Comments.load(comments,parent.parent()),parent.remove()},activeClass:"replies-button-active"}),tappable(".sub",{onTap:function(e,target){var sub=$(target);V.Actions.moveMenu(move.left),C.Subreddits.loadPosts(sub.first().text()),V.Subreddits.cleanSelected(),sub.addClass("sub-active"),currentView===view.comments&&V.Actions.backToMainView()},allowClick:!1,activeClassDelay:100,activeClass:"link-active"}),tappable(".btn-to-main",{onTap:function(){location.hash="#"}}),tappable(".btn-refresh",{onTap:function(e){var origin=e.target.getAttribute("data-origin");switch(origin){case"footer-main":refreshCurrentStream();break;case"footer-detail":if(!currentThread)return;C.Comments.show(currentThread,!0);break;default:if(currentView===view.comments){if(!currentThread)return;C.Comments.show(currentThread,!0)}currentView===view.main&&refreshCurrentStream()}}}),tappable(".link",{onTap:function(e,target){var comm=$(target),id=comm.attr("data-id"),link=M.Posts.list[id];if(link.self||isWideScreen)goToComments(id);else{var url=comm.attr("href"),a=doc.createElement("a");a.setAttribute("href",url),a.setAttribute("target","_blank");var dispatch=doc.createEvent("HTMLEvents");dispatch.initEvent("click",!0,!0),a.dispatchEvent(dispatch)}},allowClick:!1,activeClassDelay:100,inactiveClassDelay:200,activeClass:"link-active"}),tappable(".to-comments",{onTap:function(e,target){var id=$(target).attr("data-id");goToComments(id)},activeClass:"button-active",activeClassDelay:100}),tappable("#wide-refresh",{onTap:function(){currentThread&&C.Comments.show(currentThread,!0)},activeClass:"replies-button-active"}),tappable("#sub-title",{onTap:function(){!isDesktop&&loadingLinks||isLargeScreen||V.Actions.moveMenu(showingMenu?move.left:move.right)},activeClass:"sub-title-active"}),tappable("#add-new-sub",{onTap:function(){V.Actions.loadForAdding()}}),tappable("#remove-sub",{onTap:function(){V.Actions.loadForRemoving()}}),tappable("#more-links",{onTap:function(){doByCurrentSelection(function(){var url;url=M.currentSelection.name.toUpperCase()==="frontPage".toUpperCase()?urlInit+"r/"+M.Subreddits.getAllString()+"/":urlInit+"r/"+M.currentSelection.name+"/",C.Posts.load(url,"&after="+M.Posts.idLast)},function(){var channel=M.Channels.getByName(M.currentSelection.name);C.Posts.load(urlInit+M.Channels.getURL(channel)+"/","&after="+M.Posts.idLast)})},activeClass:"list-button-active"}),tappable("#btn-sub-man",{onTap:function(){V.Actions.showModal(T.formAgregarSubManual)},activeClass:"list-button-active"}),tappable("#btn-add-channel",{onTap:function(){V.Actions.showModal(T.formAddNewChannel)},activeClass:"list-button-active"}),tappable("#more-subs",{onTap:function(e,target){$(target).parent().remove();var main=V.mainWrap;main.append("<div class='loader'></div>"),$.ajax({url:urlInit+"reddits/"+urlEnd+"&after="+M.Subreddits.idLast,dataType:"jsonp",success:function(list){var nuevosSubs=Mustache.to_html(T.Subreddits.toAddList,list.data);M.Subreddits.idLast=list.data.after,$(".loader",main).remove(),main.append(nuevosSubs).append(T.botonCargarMasSubs),subreddits+=nuevosSubs},error:function(){$(".loader").addClass("loader-error").text("Error loading more subreddits. Refresh to try again.")}})},activeClass:"list-button-active"}),tappable(".btn-add-sub",{onTap:function(e,target){var parent=$(target).parent(),subTitle=$(".subreddit-title",parent);subTitle.css("color","#2b9900");var newSub=subTitle.text();V.Subreddits.insert(newSub)},activeClass:"button-active"}),tappable(".sub-to-remove > div",{onTap:function(e,target){C.Subreddits.remove($(target).data("name"))},activeClass:"button-active"}),tappable(".channel-to-remove > div",{onTap:function(e,target){C.Channels.remove($(target).data("title"))},activeClass:"button-active"}),tappable(".close-form",V.Actions.removeModal),tappable("#about",{onTap:function(){V.Actions.showModal(T.about)},activeClassDelay:100}),tappable("#sorting p",{onTap:function(e,target){if(!editingSubs||isDesktop){var choice=$(target),sortingChoice=choice.text();
sortingChoice!==currentSortingChoice&&($(".sorting-choice").removeClass("sorting-choice"),choice.addClass("sorting-choice"),C.Sorting.change(sortingChoice))}},activeClass:"link-active",activeClassDelay:100}),tappable("#exp-data",{onTap:createBackup}),tappable("#imp-data",{onTap:function(){V.Actions.showModal(T.importData)}}),tappable("#btn-save-dbx",{onTap:function(){if(!gists.fileURL)return void alert("Err. There's no backup file created...");var options={files:[{url:gists.fileURL,filename:"reedditdata.json"}],success:V.Actions.removeModal};Dropbox.save(options)},activeClass:"btn-general-active"}),tappable("#btn-dbx-imp",{onTap:chooseFromDropbox,activeClass:"btn-general-active"}),V.detailView.swipeRight(function(){isWideScreen||(location.hash="#")}),V.mainView.swipeRight(function(){!isDesktop&&loadingLinks||isLargeScreen||currentView===view.main&&V.Actions.moveMenu(move.right)}),V.mainView.swipeLeft(function(){!isDesktop&&loadingLinks||isLargeScreen||showingMenu&&V.Actions.moveMenu(move.left)}),V.mainView.on("swipeLeft",".link",function(){if(!isWideScreen&&!showingMenu){var id=$(this).data("id");goToComments(id)}}),win.applicationCache&&win.applicationCache.addEventListener("updateready",function(){var delay=1;showingMenu&&(V.Actions.moveMenu(move.left),delay=301),setTimeout(function(){V.mainWrap.prepend("<div class='top-buttons'><div id='btn-update'>Reeddit updated. Press to reload</div></div>"),tappable("#btn-update",{onTap:function(){win.location.reload()},activeClass:"list-button-active"})},delay)},!1),win.addEventListener("resizeend",function(){isWideScreen=checkWideScreen(),isLargeScreen=checkLargeScreen(),scrollTop(),isLargeScreen&&showingMenu&&V.Actions.moveMenu(move.left),isiPad&&scrollFix()},!1),win.addEventListener("hashchange",function(){""===location.hash?(V.Actions.backToMainView(),$(".link.link-selected").removeClass("link-selected"),V.Actions.setDetailFooter(""),setTimeout(function(){V.detailWrap.empty()},isWideScreen?1:301)):goToCommentFromHash()},!1),V.title.remove(),isWideScreen&&V.footerPost.text(T.noLink),M.currentSelection.loadSaved(),C.Subreddits.loadSaved(),C.Channels.loadSaved(),location.hash&&goToCommentFromHash(),doByCurrentSelection(function(){var i=M.Subreddits.list.indexOf(M.currentSelection.name);if(i>-1){var activeSub=doc.getElementsByClassName("sub")[i];$(activeSub).addClass("sub-active")}M.currentSelection.name.toUpperCase()==="frontPage".toUpperCase()?(C.currentSelection.setSubreddit("frontPage"),C.Posts.load(urlInit+"r/"+M.Subreddits.getAllString()+"/")):C.Posts.load(urlInit+"r/"+M.currentSelection.name+"/"),V.Actions.setSubTitle(M.currentSelection.name)},function(){for(var channel,i=0;i<M.Channels.list.length;i++)if(channel=M.Channels.list[i],channel.name===M.currentSelection.name){var active=doc.getElementsByClassName("channel")[i];$(active).addClass("channel-active");break}C.Channels.loadPosts(channel)}),scrollTop();var loadMnml=store.getItem("mnml"),isMnml=loadMnml?JSON.parse(loadMnml):!1;if(V.Actions.switchMnml(!1,isMnml),!isDesktop){var touch="touchmove",UA=navigator.userAgent;$id("edit-subs").addEventListener(touch,function(e){e.preventDefault()},!1),doc.getElementsByTagName("header")[0].addEventListener(touch,function(e){showingMenu&&e.preventDefault()},!1),isiPad=/iPad/.test(UA),isiPad&&(scrollFix=function(){var nextHeight="36px"===$(".menu-desc").css("height")?"35px":"36px";setTimeout(function(){$(".menu-desc").css("height",nextHeight)},500)})(),/iPhone|iPod|iPad/.test(UA)&&"7"===UA.match(/ OS (\d+)_/i)[1]&&(isMnml||V.Actions.switchMnml(!0,!0),body.classList.add("ios7"))}}(window);