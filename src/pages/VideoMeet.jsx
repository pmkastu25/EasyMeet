import React, { useEffect,useState, useRef } from 'react';
import io from "socket.io-client";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import MicIcon from '@mui/icons-material/Mic' 
import MicOffIcon from '@mui/icons-material/MicOff'
import styles from "../styles/videoComponent.module.css"
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

var connections  = {};

const peerConfigConnections = {
    "iceServers": [
        {"urls" : "stun:stun.l.google.com:19302"}
    ]
}

function VideoMeetComponent() {
    // let connections = useRef({})
    // connections.current

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("")

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // //todo
    // if(isChrome() === false){
    // }
    const getPermissions = async () => {
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});

            if(videoPermission) {
                setVideoAvailable(true);
            }else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});

            if(audioPermission) {
                setAudioAvailable(true);
            }else {
                setAudioAvailable(false);
            }

            if(navigator.mediaDevices.getDisplayMedia){
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false)
            }

            if(videoAvailable || audioAvailable){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable})

                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream  //stream defined under srcObject of video tag
                    }
                }
            }
         } catch(err) {
            console.log(err);
        }
    }

    let getUsermediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch(e) {
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if(id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                }).catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch(e) {
                console.log(e)
            }

            //TODO BLackSilence

             let blackSilence = (...args) => new MediaStream([black(...args), silence()])

            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for(let id in connections){
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description).then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                    }).catch(e => console.log(e))
                })
            }
        })
    }

    let silence = ()=>{
        let ctx = new AudioContext();

        let oscillator = ctx.createOscillator();

        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false})
    }


    let black = ({width = 640, height = 480} = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});

        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false})
    }

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable)){
            //connect audio,video state
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then (getUsermediaSuccess) //TODO: getUsermediaSuccess. mute audio or close video in all other computers connected through stream, send only audio or video stream
            .then((stream)=>{})
            .catch((e)=>console.log(e))

        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch(e) {}
        }
    }

    useEffect(() =>{
        getPermissions();
    },[])

    useEffect(() => {
        if(video !== undefined && audio !== undefined){
            getUserMedia();
        }
    }, [audio, video])

    //TODO
    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if(fromId !== socketIdRef.current){
            if(signal.sdp){
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if(signal.sdp.type === "offer"){
                        connections[fromId].createAnswer().then((description)=>{
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({"sdp":connections[fromId].localDescription}
                                ))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if(signal.ice){
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    //TODO: addMessage
    let addMessage = (data, sender, socketIdSender) => {
        setMessages((prev) => [
            ...prev, {sender: sender, data: data}
        ]);

        //New message
        if(socketIdSender !== socketIdRef.current){
            setNewMessages((prevMessages) => prevMessages+1);
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, {secure: false});

        socketRef.current.on('signal', gotMessageFromServer) //connected to emmited signal from server

        socketRef.current.on("connect", ()=>{
            socketRef.current.emit("join-call", window.location.href);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage)

            socketRef.current.on("user-left", (id)=> {
                //TODO
                setVideos((videos)=>videos.filter((video)=>video.socketId !== id)) //get all videos exce
                // pt the id that has left
            })

            socketRef.current.on("user-joined", (id, clients) => {
                console.log(id)
                console.log(clients)
                
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connections[socketListId].onicecandidate = (event) => {
                        //icecandidate  is a protocol (interactive connectivity establishment) makes a direct connection between the clients
                        //send connection to signalling server to all clients
                        if(event.candidate !== null){
                            socketRef.current.emit("signal", socketListId, JSON.stringify({'ice': event.candidate}));
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId)

                        if(videoExists) {
                            console.log("FOUND EXISTING");

                            setVideos(videos => {
                                const updatedVideos = videos.map(video => 
                                    video.socketId === socketListId ? {...video, stream: event.stream} : video
                                );
                            //socketListID will loop infinitely but video.socketId gets current id\
                            videoRef.current = updatedVideos; //instantaneously update videos
                            return updatedVideos;
                            });
                        } else {
                            //Create new video
                            console.log("CREATING NEW")

                            let newVideo = {
                                socketId: socketListId, 
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo]
                                videoRef.current = updatedVideos;
                                return updatedVideos
                            });
                        }
                    };

                    if(window.localStream !== undefined && window.localStream !== null){
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        //TODO: blacksilence
                        //blacksilence: video off ---> blackcoloured screen
                        // let blackSilence
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence();
                        
                        connections[socketListId].addStream(window.localStream);
                        
                    }
                })
                if(id === socketIdRef.current){
                    for(let id2 in connections){
                        if(id2 === socketIdRef.current) continue

                        try{
                            connections[id2].addStream(window.localStream)
                        } catch(e) {
                            connections[id2].createOffer().then((description) => {
                                connections[id2].setLocalDescription(description)
                                .then(()=>{
                                    socketRef.current.emit("signal", id2, JSON.stringify({"sdp":connections[id2].localDescription}))
                                })
                                .catch(e => console.log(e))
                            })
                        }
                    }
                }
            })
    })
    }

    let getMedia = () => {
        setVideo(videoAvailable); //Async
        setAudio(audioAvailable); //Async
        connectToSocketServer();
    }

    let connect = () =>{
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    let getDisplayMediaSuccess = (stream) => {
        try{
            window.localStream.getTracks().forEach(track => track.stop());
        } catch(e) {console.log(e)}

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if(id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                .then(()=> {
                    socketRef.current.emit('signal', id, JSON.stringify({"sdp": connections[id].localDescription}))
                })
                .catch(e => console.log(e))
        })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch(e) {
                console.log(e)
            }

            //TODO BLackSilence

             let blackSilence = (...args) => new MediaStream([black(...args), silence()])

            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    
    }

    let getDisplayMedia = () => {
        if(screen) {
            if(navigator.mediaDevices.getDisplayMedia){
                navigator.mediaDevices.getDisplayMedia({video: true, audio :true})
                .then(getDisplayMediaSuccess)
                .then((stream) => {})
                .catch((e) => console.log(e));
            }
        }
    }

    useEffect(() => {
        if(screen !== undefined){
            getDisplayMedia();
        }
    },[screen])

    let handleScreen = () => {
        setScreen(!screen);
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }

    let handleEndCall = () => {
        try{
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        } catch(e) {}
        window.location.href = "/home";
    }

    return ( 
        <div>
            {askForUsername === true ? 
            <div>
                <h2>Enter into Lobby</h2>
                <TextField id="outlined-basic" label="Username" 
                value={username}
                onChange = {(e) => {setUsername(e.target.value)}}
                variant="outlined" />
                <Button variant="contained" onClick={connect}>Connect</Button>

                <div>
                    <video ref={localVideoRef} autoPlay muted ></video> 
                </div>

            </div>: <div className={styles.meetVideoContainer}>
            {showModal ? 
            <div className={styles.chatRoom}>
                <div className={styles.chatContainer}>
                    <h1>Chat</h1>
                    <div className={styles.chattingDisplay}>
                {console.log(messages)}
                        {messages.length > 0 ? messages.map((item, index) => {
                            return (
                                <div style={{marginBottom: "20px"}} key={index}>
                                    <p style={{fontWeight: "bold"}}>{item.sender}</p>
                                    <p>{item.data}</p>
                                </div> 
                            )
                        }) : <p>No Messages Yet</p>}
                    </div>
                    <div className={styles.chattingArea}>
                        <TextField id="outlined-basic" label="Enter Your Chat" 
                        onChange={(e)=> setMessage(e.target.value)}
                variant="outlined" />
                <Button variant="contained" onClick={sendMessage}>Send</Button>
                </div>
                    </div>
            </div>: <></>}

            <div className='buttonContainer'>
                <div className={styles.buttonContainer}>
                    <IconButton onClick={handleVideo} style={{color: 'white'}}>
                       {(video === true) ? <VideocamIcon/> : <VideocamOffIcon/>} 
                    </IconButton>
                    <IconButton onClick={handleEndCall} style={{color: 'red'}}>
                       <CallEndIcon />
                    </IconButton>
                    <IconButton onClick={handleAudio} style={{color: 'white'}}>
                      {audio === true ? <MicIcon/> : <MicOffIcon/>}
                    </IconButton>

                    {screenAvailable === true ? <IconButton onClick={handleScreen} style={{color: 'white'}}>
                        {screen === true ? <ScreenShareIcon/> : <StopScreenShareIcon/>}
                    </IconButton> : <></>} 

                    <Badge badgeContent={newMessages} max={999} color='secondary'>
                        <IconButton onClick={()=> setModal(!showModal)}style={{color: 'white'}}>
                            <ChatIcon />
                        </IconButton>
                    </Badge>
                </div>
            </div>    

            <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>
            {console.log(videos)
             //TODO: videos arr is not updated here
            } 
            <div  className={styles.conferenceView}>
            {videos.map((video) => (   
                <div key={video.socketId}>
                    <video 
                     
                    data-socket={video.socketId}
                    ref = {ref => {
                        if(ref && video.stream){
                            ref.srcObject = video.stream;
                        }
                    }}

                    autoPlay
                    ></video>   
                </div>
            ))}

            </div>
            </div>
            }
        </div> 
     );
}

export default VideoMeetComponent;

