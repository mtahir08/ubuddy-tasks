import express from 'express'
import fs from 'fs'
import path from 'path'
import lineReader from 'readline'

const app = express()
const filename = path.resolve(__dirname, 'stream.txt')

const eventNames = {
    users: [],
    chatGroups: [],
}

try {

    const createLineReader = lineReader.createInterface({
        input: fs.createReadStream(filename),
        terminal: false
    })

    createLineReader.on('line', (line) => {
        const [type] = checkEventType(line)
    });

    createLineReader.on('close', () => {
        /**
        |--------------------------------------------------
        | Count unread messages for user "Emma"
        |--------------------------------------------------
        */
        calculateUnreadMessages("Emma");
        /**
        |--------------------------------------------------
        | Mean response time  for user "Joe"
        |--------------------------------------------------
        */
        calculateResponseTime("Joe")


    })

} catch (e) {
    console.log("error in try", e)
}


function calculateResponseTime(name) {
    for (let o in eventNames.chatGroups) {
        const chatGroup = eventNames.chatGroups[o]
        if (chatGroup.chats.length) {
            const user = checkUserInGroup(chatGroup.members, name)
            if (user) {

                const [difference, responseCounter] = checkTimeDifference(chatGroup.chats, name)
                const meanTime = (difference) / responseCounter
                console.log("      Mean Difference " + (meanTime || 0) + " Hour(s)")

            }

        }
    }
}

/**
|--------------------------------------------------
| Mean response time  for user "Joe" started
|--------------------------------------------------
*/
function checkTimeDifference(chats, name) {
    // time difference between applicants messages and mentor reply
    let difference = 0;
    // responding time counter
    let responseCounter = 0;
    // flag to check if mentor replied or not
    let replied = false
    // time of applicant
    let time = 0;
    console.log("======================================")
    console.log("Name | Message Time | Time Difference")
    console.log("--------------------------------------")
    chats.map((chat, index) => {
        let splitTime = chat.time.split(":")
        //  hour * 60 + minutes - previous time in minutes          
        splitTime = splitTime[0] * 60 + parseInt(splitTime[1])

        if (index > 0 && !replied && chat.sender == name) {
            const currentTimeDifference = (splitTime - time)
            difference += currentTimeDifference
            console.log(chat.sender + "  | " + chat.time + "        | " + currentTimeDifference + " Min(s)")
            time = 0;
            responseCounter++;
            replied = true;
            return
        } else if (chat.sender != name && time == 0) {
            console.log(chat.sender + " | " + chat.time)
            time = parseInt(splitTime)
            replied = false;
            return
        }
    })

    /**
     * We have time difference in minutes so we need to 
     * set in hour by dividing 60
     */
    console.log("--------------------------------------")
    console.log("      Mean Difference ", difference + " Min(s)")
    return [difference / 60, responseCounter]
}


/**
|--------------------------------------------------
| Count unread messages for user "Emma" Started
|--------------------------------------------------
*/
function calculateUnreadMessages(name) {
    for (let o in eventNames.chatGroups) {
        const chatGroup = eventNames.chatGroups[o]
        if (chatGroup.chats.length) {
            const user = checkUserInGroup(chatGroup.members, name)
            if (user) {
                const userArray = Object.keys(chatGroup.seen)
                const isMessageRead = userArray.find((u) => u == name)
                const unReadMessages = isMessageRead ?
                    countUnreadMessages(chatGroup.chats, chatGroup.seen[isMessageRead]).length :
                    chatGroup.chats.length
                console.log("==============================================")
                console.log(`Group ${chatGroup.name}`)
                console.log(`Total Messages ${chatGroup.chats.length}`)
                console.log(`Total Unread messages of ${name} in ${chatGroup.name} is ${unReadMessages}`)
                console.log("==============================================")
            }
        }
    }
}
function checkUserInGroup(members, name) {
    return members.find((member) => member == name)
}

function countUnreadMessages(chats, seenTime) {
    return chats.filter((chat) => chat.time > seenTime)
}

/**
|--------------------------------------------------
| make object so we can use it easily
|--------------------------------------------------
*/
function checkEventType(line) {
    const itemSeperated = line.split(" ")
    const type = itemSeperated[0]
    switch (type) {
        case 'User': {
            const obj = {
                name: itemSeperated[1],
                university: itemSeperated[2],
                role: itemSeperated[3],
            }
            eventNames['users'].push(obj)
            return ""
        }
        case 'ChatGroup': {
            const group = itemSeperated[1]
            eventNames['chatGroups'][group] = { name: group, seen: {}, chats: [], members: itemSeperated.slice(2) }
            return ""
        }
        case 'Message': {

            const obj = {

                text: itemSeperated[3],
                time: itemSeperated[4],
                sender: itemSeperated[1],
            }
            const group = itemSeperated[2]
            eventNames['chatGroups'][group].chats.push(obj)
            return ""
        }

        case 'Read': {
            const group = itemSeperated[1]
            eventNames['chatGroups'][group].seen[itemSeperated[2]] = itemSeperated[3]
            return ""
        }
        default:
            return ""

    }
}

export default app;
