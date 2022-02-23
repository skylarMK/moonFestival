var app = {
    el: "#app",
    data: {
        name: "2020MoonFestival",
        rankings: [{
            rank: 1,
            fb: "",
            name: "",
            score: ""
        }],
        user: {
            id: "0",
            name: "",
            email: "",
            token: "",
            hasAgreed: null,
            phone: "",
            ranking: {
                rank: 0,
                fb: "",
                name: "",
                score: ""
            }
        },
        game: {
            /* MAIN | GAME | CLEAR */
            scene: "MAIN",
            /* AUTH | PRELOAD | PRELOADED | PLAYING | END */
            playState: "END",
            score: 0,
            timer: 0,
            time: {
                started: 0,
                finished: 0,
                interval: 0
            },
            config: {
                baseline: 50,
                timer: {
                    preload: 5,
                    max: 60
                }
            },
            historyId: 0
        },
        isMoonShowTime: false,
        isFoodShowTime: false,
        foods: ["shrimp", "cucumber", "clam", "steak", "meat"],
        /* RANKING | GIFT | CONTACT | SUCCESS | SHARE | NOTICE */
        dialog: "",
        contact_msg: "",
        newsID: "4030",
        news: []
    },
    created: function () {

        this.getRanking();
        this.news = GetSetnNews(this.newsID);
    },
    computed: {
        timerControlClass: function () {
            return {
                "timer": this.scene = "GAME",
                "iteration-5": this.game.playState == "PRELOAD",
                "iteration-65": this.game.playState == "PLAYING" && !this.isCleared,
                "fixTimer": this.game.timer > 9,
                "preload": this.game.playState == "PRELOAD",
                "slideToMoon": this.game.playState == "PRELOADED"
            };
        },
        rabbitImage: function () {
            var num = 10;
            if (this.game.score != 0) {
                num = this.game.score % 2;
            }

            if (this.game.score % 10 == 1) {
                num = 11;
            }

            if (this.isCleared) {
                num = 10;
            }

            return "images/rabbitEat-" + num + ".png";
        },
        foodImage: function () {
            var num = Math.floor(this.game.score % 10 / 2);
            var foodIndex = Math.floor(this.game.score / 10);
            if (foodIndex == this.foods.length) {
                return false;
            }

            return "images/" + this.foods[foodIndex] + num + ".png";
        },
        moonImage: function () {
            return this.isMoonShowTime ? "images/moon.png" : "images/moon2.png";
        },
        isCleared: function () {
            var cleared = this.game.score == this.game.config.baseline;
            if (cleared) {
                this.game.time.finished = Date.now();
            }

            return cleared;
        },
        time: function () {
            this.game.time.interval = ((this.game.time.finished - this.game.time.started) / 1000).toFixed(2);
            this.game.time.interval = this.game.time.interval >= 60000 ? 60000 : this.game.time.interval;
            return this.game.time.interval;
        },
        shareImageUrl: function () {
            return "https://event.setn.com/share/images/" + this.name + "/" + this.game.historyId + ".jpg";
        }
    },
    methods: {
        start: function () {
            if (!this.user.hasAgreed) {
                this.user.hasAgreed = false;
                return false;
            }

            if (!register()) {
                return false;
            }

            this.game.score = 0;
            this.game.timer = this.game.config.timer.preload;
            this.isFoodShowTime = false;
            this.isMoonShowTime = false;
            this.game.scene = "GAME";
            this.game.playState = "PRELOAD";
        },
        restart: function () {
            this.game.playState = "END";
            this.game.scene = "MAIN";
        },
        play: function () {
            this.game.playState = "PLAYING";
            this.game.time.started = Date.now();
            this.game.time.finished = this.game.time.started + this.game.config.timer.max * 1000;
        },
        clearStage: function () {
            this.game.scene = "CLEAR";
            this.submitScore();
            this.getRanking();
        },
        toggleDialog: function (name) {
            this.dialog = this.dialog == name ? "" : name;
        },
        timerController: function (isEnd) {
            switch (this.game.playState) {
                case "PRELOAD":
                    this.game.timer--;
                    break;
                case "PLAYING":
                    this.game.timer++;
                    break;
            }

            if (this.game.timer == this.game.config.timer.max) {
                this.clearStage();
            }

            if (isEnd) {
                switch (this.game.playState) {
                    case "PRELOAD":
                        this.game.playState = "PRELOADED";
                        break;
                    case "PRELOADED":
                        this.play();
                        break;
                    case "PLAYING":
                        break;
                }
            }
        },
        hit: _.throttle(function (e) {
            if (this.game.playState != "PLAYING") {
                return false;
            }

            if (this.isCleared) {
                return false;
            }

            this.game.score++;
        }, 35),
        eatingFoodClass: function (i) {
            return {
                "eating": Math.floor((this.game.score - 2) / 10) == i,
                "hidden": this.game.score % 10 == 0
            }
        },
        isFoodExist: function (baseline) {
            baseline = parseInt(baseline);
            return this.game.score < baseline || this.isFoodShowTime;
        },
        getRanking: function () {

            var url = "https://event.setn.com/api/ranking/" + this.name + "/";
            if (this.user.id !== "0") {
                url = url + this.user.id;
            }
            var result = [];
            $.getJSON(url, function (data) {
                $.each(data, function (key, val) {
                    if (key == 0) {
                        if (val.rank !== 0) {
                            vm.user.ranking = val;
                        }
                        return;
                    }
                    result.push(val);
                });
            });
            this.rankings = result;
            return false;
        },
        submitContact: function (e) {
            if (this.user.phone == "" || isNaN(this.user.phone)) {
                alert("請輸入正確聯絡電話(限數字)");
                return false;
            }
            $.ajax({
                method: "POST",
                url: "https://event.setn.com/api/event/signUp/" + this.name + "/" + this.user.id,
                data: {
                    "contact": this.user.phone
                },
                dataType: "json",
                context: this,
                success: function (response) {
                    this.contact_msg = "參加登記成功，";
                    return false;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    this.contact_msg = "您已經參加過活動了，";
                    return false;
                },
                complete: function (jqXHR, textStatus, errorThrown) {
                    this.toggleDialog("SUCCESS")
                    return false;
                },
            });
        },
        submitScore: function (e) {
            $.ajax({
                method: "POST",
                url: "https://event.setn.com/api/score/" + this.name,
                data: {
                    "fb_id": this.user.id,
                    "name": this.user.name,
                    "email": this.user.email,
                    "num": this.time
                },
                dataType: "json",
                context: this,
                success: function (response) {
                    this.game.historyId = response.id;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                }
            });
        },
        FacebookShare: function () {
            facebookMe.target.refer = this.name;
            facebookMe.target.href = "https://event.setn.com/share/" + this.name + "/" + this.game.historyId;
            facebookMe.target.hashtag = "#中秋玩遊戲抽豪禮";
            facebookMe.share();
        }

    }
};


function register() {
    if (!vm.user.token.length) {
        openFacebookRegister();
        return false;
    }

    return true;
}

function openFacebookRegister() {
    window.open('https://memberapi.setn.com/Customer/FacebookLoginForEvent?e=' + vm.name, '', config = 'height=800,width=600');
    return true;
}

function callbackFacebookLogin(data) {
    if (data.result !== true) {
        return false;
    }

    vm.user.token = data.GetObject.token;
    $.ajax({
        method: "GET",
        url: "https://event.setn.com/api/user",
        data: { token: vm.user.token },
        dataType: "json",
        context: this,
        success: function (response) {
            vm.user.id = response.fb_id;
            vm.user.name = response.name;
            vm.user.email = response.email;
            vm.start();
        },
        error: function (jqXHR, textStatus, errorThrown) {
        }
    });
}

function GetSetnNews(projectid) {
    var result = [];
    $.ajaxSettings.async = false;
    $.getJSON("https://webapi.setn.com/api/Project/GetProjectNewSList/" + projectid + "/0", function (data) {
        $.each(data[0].newsList, function (key, val) {
            result.push({
                "shortSlug": val.shortSlug,
                "imageFile": val.imageFile,
                "imageID": val.imageID,
                "url": val.url,
            })
        });
        Vue.nextTick(function () {
            startCarousel();
        });
    });
    return result;
}

$(document).ready(function () {
    // if (document.location.protocol == "http:") {
    //     window.location.replace("https://acts.setn.com/event/" + app.data.name);
    // }

    vm = new Vue(app);
    window.addEventListener('message', function (event) {
        if ((event.origin.indexOf('setn.com') != -1) || (event.origin.indexOf('sanlih.com.tw') != -1)) {
            callbackFacebookLogin(event.data);
        }
    });
});
