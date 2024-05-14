<template>
  <div id="admin" :class="this.$ismobile ? 'mobile' : 'computer'">
    <textarea name="" v-model="text" rows="5" placeholder="广播内容"></textarea>
    <button class="logout" @click="logout">退出登陆</button>
    <button class="broadcast" @click="send">广播</button>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data: function () {
    return {
      text: "",
      socket: null,
    };
  },
  methods: {
    initsocket: function () {
      let that = this;
      if (typeof WebSocket == "undefined") {
        console.log("浏览器不支持websocket");
      } else {
        console.log("浏览器支持websocket");
      }
      if (this.socket != null) {
        this.socket.close();
        this.socket = null;
      }
      let socketURL = "ws://localhost:8086/websocket/000";
      this.socket = new WebSocket(socketURL);
      this.socket.onopen = function () {
        console.log("websocket已打开");
      };
      this.socket.onclose = function () {
        console.log("websocket已关闭");
      };
      this.socket.onerror = function () {
        console.log("websocket发生了错误");
      };
      this.socket.onmessage = function (msg) {
        let data = JSON.parse(msg.data);
        if (data.type != "check") {
          return;
        }
        if (confirm("是否同意" + data.jobno + "的修改密码申请")) {
          axios({
            method: "put",
            params: {
              jobno: data.jobno,
              password: data.password,
            },
            url: "/user/update/password",
            baseURL: "http://" + that.$baseURL,
          })
            .then((res) => {
              console.log(res.data);
            })
            .catch((err) => {
              console.error(err);
            });
        }
      };
    },
    send: function () {
      let msg = {
        cno: "0",
        text: { type: "broadcast", msg: this.text },
      };
      this.socket.send(JSON.stringify(msg));
      this.text = "";
    },
    logout: function () {
      this.socket.close();
      this.socket = null;
      this.$cookies.remove("user");
      this.$router.push("/login");
    },
  },
  mounted() {
    this.initsocket();
  },
};
</script>

<style>
#admin {
  height: 100vh;
  font-size: 1em;
  position: relative;
  margin: 0 auto;
}

#admin.computer {
  width: 60%;
}

#admin.mobile {
  width: 100%;
}

#admin textarea {
  position: absolute;
  left: 10px;
  bottom: 10px;
  border: 2px solid var(--primary-secondery);
  border-radius: 10px;
  padding: 10px;
  width: 80%;
  resize: none;
}

#admin button {
  font-size: 1em;
  position: absolute;
  right: 10px;
  background-color: var(--primary-secondery);
  width: 100px;
  padding: 15px;
  border-radius: 10px;
}

#admin .broadcast {
  bottom: 10px;
}

#admin .logout {
  bottom: 95px;
}
</style>