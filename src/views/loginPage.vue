<template>
  <div id="login">
    <div :class="['box', this.$ismobile ? 'mobile' : 'computer']">
      <h2>即时通信</h2>
      <div class="inputBox">
        <input type="text" v-model="jobno" required="required" />
        <span>帐号</span>
      </div>
      <div class="inputBox">
        <input type="password" v-model="password" required="required" />
        <span>密码</span>
        <button @click="forgot">忘记密码</button>
      </div>
      <div class="buttonBox">
        <button @click="login">登陆</button>
        <button @click="regist">注册</button>
      </div>
    </div>
  </div>
</template>

<script>
import md5 from "js-md5";
import axios from "axios";
export default {
  data() {
    return {
      jobno: "",
      password: "",
    };
  },
  methods: {
    userRequest: function (func) {
      if (!this.jobno || !this.password) {
        alert("请输入帐号和密码");
        return;
      }
      axios({
        method: func == "login" ? "get" : "post",
        params: {
          jobno: this.jobno,
          password: md5(this.password),
        },
        url: "/user/" + func,
        baseURL: "http://" + this.$baseURL,
      })
        .then((msg) => {
          if (msg.data.code == "404") {
            alert("请检查帐号是否正确");
            console.error(msg.data);
          } else if (msg.data.code == "401") {
            alert("密码输入错误");
            console.error(msg.data);
          } else if (msg.data.code == "409") {
            alert("帐号已存在");
            console.error(msg.data);
          } else {
            this.$cookies.set("user", msg.data.data);
            if (func == "regist") alert("帐号注册成功，正在登陆");
            if (this.jobno == "000") {
              this.$router.push("/admin");
            } else {
              this.$router.push("/main");
            }
          }
        })
        .catch((err) => {
          console.error(err);
          alert("未知错误");
        });
    },
    login: function () {
      this.userRequest("login");
    },
    regist: function () {
      this.userRequest("regist");
    },
    forgot: function () {
      let that = this;
      let socket = new WebSocket("ws://" + this.$baseURL + "/websocket/temp");
      socket.onopen = function () {
        socket.send(
          JSON.stringify({
            cno: "000",
            text: {
              type: "check",
              jobno: that.jobno,
              password: md5(that.password),
            },
          })
        );
        socket.close();
      };
      alert("已向“000”号用户发送修改密码请求，请耐心等待");
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

#login {
  height: 100vh;
}

.box {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: var(--neutral-secondery);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  user-select: none;
  gap: 20px;
}

.box.mobile {
  width: 90%;
  height: 350px;
}

.box.computer {
  width: 30%;
  height: 50%;
}

.inputBox {
  position: relative;
  width: 75%;
}

.inputBox input {
  width: 100%;
  padding: 15px;
  border: 2px solid var(--primary-secondery);
  background: none;
  border-radius: 10px;
  outline: none;
  color: var(--neutral-main);
  font-size: 1em;
  /* 过渡 */
  transition: 0.3s;
}

.inputBox span {
  position: absolute;
  left: 0;
  padding: 15px;
  pointer-events: none;
  font-size: 1em;
  font-weight: bold;
  color: var(--primary-secondery);
  /* 过渡 */
  transition: 0.3s;
}

.inputBox input:valid ~ span,
.inputBox input:focus ~ span {
  color: var(--primary-main);
  /* 变换位置 */
  transform: translateX(15px) translateY(-7px);
  font-size: 0.65em;
  padding: 0 5px;
  background-color: var(--neutral-secondery);
  letter-spacing: 0.1em;
}

.inputBox input:valid,
.inputBox input:focus {
  border: 2px solid var(--primary-main);
}

.inputBox button {
  background-color: transparent;
  color: var(--primary-secondery);
  font-weight: bold;
  float: right;
}

.inputBox button:hover {
  color: var(--primary-main);
}

/* 给按钮写样式 */
.buttonBox button {
  padding: 10px 30px;
  border-radius: 10px;
  background: none;
  font-size: 1em;
  color: var(--primary-secondery);
  border: 2px solid var(--primary-secondery);
  font-weight: 600;
  margin: 0 20px;
}

.buttonBox button:hover {
  color: var(--primary-main);
  border: 2px solid var(--primary-main);
}
</style>