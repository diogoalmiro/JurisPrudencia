import './styles/App.css';
import React, { useRef, useState, useEffect } from 'react';

import entitieOption from './components/entitieOption';
import Sidebar from './components/sidebar';
import TokenAnnotator from './tokenAnnotator/TokenAnnotator.tsx';
import ActionMenu from './components/actionMenu';
import PopUpMenu from './components/popUpMenu';
import OutsideClickHandler from 'react-outside-click-handler';
import TableComponent from './components/table';
import TableComponent2 from './components/table2';
import Header from './components/header';
import parse from 'html-react-parser';


import { useAppContext } from './context/context';



//const example_json = require("./data/example.json");

// eslint-disable-next-line import/no-webpack-loader-syntax
var new_example_html_file = require('raw-loader!./data/new_example_2.html');
var new_example_html = new_example_html_file.default;

let anomRules = {
  "PER": "PER",
  "DAT": "DAT",
  "ORG": "ORG",
  "LOC": "LOC",
  "PRO": "PRO",
  "MAT": "MAT"
}


function App() {
  let tokenCounter = 0
  let value = []
  let entitieCounter = {
    "PER":0,
    "DAT":0,
    "ORG":0,
    "LOC":0,
    "PRO":0,
    "MAT":0
  }

  const {
    value_sidebar,
    allEntities,
    setAllEntites,
    anomTokens,
    setAnomTokens,
    anomValues,
    setAnomValues,
    last_index,
    tag,
    menuStyle,
    setMenuStyle,
    popUpMenu,
    setPopUpMenu,
    mode,
    setMode,
    rows
  } = useAppContext()

  function createRows() {
    let res = []

    let old_value = anomValues.value

    for (let entitie of allEntities) {
      let entities = entitie.tokens
      let type = entitie.tag
      let name = ""
      let counter = 0
      
      entitieCounter[type] ++
      
      let anom = anomRules[type] + entitieCounter[type]
      
      for (let e of entities) {
        name += e.text
        // If not last
        if (counter != entities.length-1) {
          name += "<br></br>"
        }
        counter++

        // Add anom value to anomValues
        for (let value of old_value) {
          if (e.ids.includes(value.start)) {
            value.anom = anom
          }
        }
      }
      
      name = parse(name)
      
      res.push({ name, type, anom })
      entitie.anom = anom

      //console.log(old_value)

    }
    
    // setAnomValues({
    //   value: old_value,
    //   tag: anomValues.tag
    // })

    rows.current = res
  }
  

  useEffect(() => {
    readHtml()
  }, [])

  const handleNewEntitie = (value, p, text) => {
    // TODO: Update ALL Entitites based on new value
    setMenuStyle({
      left: p.left,
      top: p.top + 10,
      showMenu: true
    })
    let old_tag = anomValues.tag
    value[value.length - 1].text = text
    addToSidebar(value[value.length - 1].text, value[value.length - 1].tag, [value[value.length - 1].start])
    setAllEntites(value_sidebar.current)
    let new_anom = {
      value: value,
      tag: old_tag
    }
    last_index.current = value.length - 1
    setAnomValues(new_anom);
  }

  const handleEntitieChange = (index, p) => {
    setMenuStyle({
      left: p.left,
      top: p.top + 10,
      showMenu: true
    })

    last_index.current = index
  }

  const handleTagChange = e => {
    setMenuStyle({
      left: 0,
      top: 0,
      showMenu: false
    })

    let new_tag  = e.target.value
    tag.current = new_tag

    let entitie = anomValues.value[last_index.current]

    let per_number = 0
    let dat_number = 0
    let org_number = 0
    let loc_number = 0
    let pro_number = 0
    let mat_number = 0

    anomValues.value.forEach(function(ent) {
      if (ent.tag === "PER" && entitie.text === ent.text) {per_number += 1}
      else if (ent.tag === "DAT" && entitie.text === ent.text) {dat_number += 1}
      else if (ent.tag === "ORG" && entitie.text === ent.text) {org_number += 1}
      else if (ent.tag === "LOC" && entitie.text === ent.text) {loc_number += 1}
      else if (ent.tag === "PRO" && entitie.text === ent.text) {pro_number += 1}
      else if (ent.tag === "MAT" && entitie.text === ent.text) {mat_number += 1}
    })

    setPopUpMenu({
      showMenu: true,
      entities: {
        "PER": per_number,
        "DAT": dat_number,
        "ORG": org_number,
        "LOC": loc_number,
        "PRO": pro_number,
        "MAT": mat_number
      }
    })
  }

  const handleMultipleTagChange = e => {

    setPopUpMenu({
      showMenu: false,
      entities: {
        "PER":0,
        "DAT":0,
        "ORG":0,
        "LOC":0,
        "PRO":0,
        "MAT":0
      }
    })

    let new_anom = null
    let new_tag  = tag.current
    let old_value = anomValues.value
    let old_text = old_value[last_index.current].text
    let old_tag = old_value[last_index.current].tag
    let new_value = []

    if (e.target.value === "Single") {
      
      if (new_tag == "Remove") {
        let old_tag = anomValues.tag
        let slice_1 = old_value.slice(0, last_index.current)
        let slice_2 = old_value.slice(last_index.current + 1)
        new_value = slice_1.concat(slice_2)
        new_anom = {
          value: new_value,
          tag: old_tag
        }
        removeFromSidebar(old_value[last_index.current].start)
        setAllEntites(value_sidebar.current)
      }
      else {
        old_value[last_index.current].tag = new_tag
        new_anom = {
          value: old_value,
          tag: new_tag
        }
        changeSidebar(old_value[last_index.current].text, new_tag, old_value[last_index.current].start)
        setAllEntites(value_sidebar.current)
      }
      setAnomValues(new_anom);
    }

    else if (e.target.value === "All-Equal") {
      old_value.forEach(function(entitie){
        if (new_tag == "Remove") {
          if (entitie.text === old_text && entitie.tag === old_tag) {
            // Ignore and dont add to new array
          }
          else {
            new_value.push(entitie)
          }
        }
        else {
          if (entitie.text === old_text && entitie.tag === old_tag) {
            // change tag
            entitie.tag = new_tag
          }
        }
      })

      if (new_tag == "Remove") {
        new_anom = {
          value: new_value,
          tag: old_tag
        }
        setAnomValues(new_anom);
      }

    }

    else if (e.target.value === "All-All") {
      old_value.forEach(function(entitie){
        if (new_tag == "Remove") {
          if (entitie.text === old_text) {
            // Ignore and dont add to new array
          }
          else {
            new_value.push(entitie)
          }
        }
        else {
          if (entitie.text === old_text) {
            // change tag
            entitie.tag = new_tag
          }
        }
      })

      if (new_tag == "Remove") {
        new_anom = {
          value: new_value,
          tag: old_tag
        }
        setAnomValues(new_anom);
      }
    }

  }

  function Side() {
    if (allEntities != null) {
      createRows()
      
      return(
        TableComponent2(rows.current, handleMerge, handleSplit, handleRemove)
      )
    }
  }

  function addToSidebar(text, role, ids) {
    let found = false
    for (let entitie of value_sidebar.current) {
      for (let token of entitie.tokens) {
        // If it already exists
        if(token.text === text && role === entitie.tag) {
          found = true
          token.ids = token.ids.concat(ids)
          break
        }
      }
    }

    if (found == false) {
      value_sidebar.current.push({
        tokens: [{
          text: text,
          ids: ids
        }],
        tag: role
      })
    }
  }

  function removeFromSidebar(id, all) {
    let last = null
    let counter = 0
    let t_counter = 0

    for (let entitie of value_sidebar.current) {
      t_counter = 0
      for(let token of entitie.tokens) {
        if (token.ids.includes(id)) {
          // If there is only one id or if we want to remove all
          if (token.ids.length === 1 || all === true) {
            last = true
            break
          }

          // If not

          let indice = token.ids.indexOf(id)

          let slice_1 = token.ids.slice(0, indice)
          let slice_2 = token.ids.slice(indice+1)
          token.ids = slice_1.concat(slice_2)
          break
        }
        t_counter++
      }
      
      if (last === true) {
        break
      }
      counter++
    }

    if (last === true) {
      // If it is the only token in entitie
      if (value_sidebar.current[counter].tokens.length === 1) {
        let slice_1 = value_sidebar.current.slice(0, counter)
        let slice_2 = value_sidebar.current.slice(counter+1)
        value_sidebar.current = slice_1.concat(slice_2)
      }
      // If not
      else {
        let slice_1 = value_sidebar.current[counter].tokens.slice(0, t_counter)
        let slice_2 = value_sidebar.current[counter].tokens.slice(t_counter+1)
        value_sidebar.current[counter].tokens = slice_1.concat(slice_2)
      }
    }
  }
  
  function changeSidebar(text, new_tag, id, all) {
    for (let entitie of value_sidebar.current) {
      for (let token of entitie.tokens) {
        if (token.ids.includes(id)) {
          // If it is an entitie with a single id or if we whish to change tag for all ids
          if (token.ids.length === 1 || all === true) {
            // Simply Change Tag
            entitie.tag = new_tag
          }
          // If there are multiple ids and we only want to change 1
          else {
            // Remove current id from sidebar
            removeFromSidebar(id, false)
            // And re-add it with new tag
            addToSidebar(text, new_tag, [id])
          }
          break
        }
      }
    }
  }

  function handleMerge(selected_list) {
    let first = null

    for (let id of selected_list) {
      if (first === null) {
        first = id
      }
      else {
        let tokens = value_sidebar.current[id].tokens
        for (let token of tokens) {
          //to_remove.push(token.ids[0])
          removeFromSidebar(token.ids[0], true)
        }

        value_sidebar.current[first].tokens = value_sidebar.current[first].tokens.concat(tokens)

        
      }
    }

    setAllEntites(value_sidebar.current)
  }

  function handleSplit(selected_list) {
    for (let id of selected_list) {
      let first = true

      // Split all tokens of an entitie
      for (let token of value_sidebar.current[id].tokens) {
        // Ignore first one
        if (first === true) {
          first = false
          continue
        } else {
          removeFromSidebar(token.ids[0], true)
          addToSidebar(token.text, token.tag, token.ids)
        }
      }
    }

    setAllEntites(value_sidebar.current)
  }

  function handleRemove(selected_list) {
    let old_value = anomValues.value
    let old_tag = anomValues.tag
    let new_value = []
    let to_remove = []
    let previous_r = 0

    //console.log(old_value)
    for (let id of selected_list) {

      for (let token of value_sidebar.current[id].tokens) {
        //console.log(token)

        // Remove from text
        for (let value_id in old_value) {
          if (token.ids.includes(old_value[value_id].start)) {
            to_remove.push(value_id)
          }
        }

        removeFromSidebar(token.ids[0], true)
      }

      for (let r_id of to_remove) {
        let slice = old_value.slice(previous_r, r_id)
        new_value = new_value.concat(slice)
        previous_r = r_id + 1
      }
      
      let slice = old_value.slice(previous_r)
      new_value = new_value.concat(slice)

      old_value = new_value
    }


    setAllEntites(value_sidebar.current)
    setAnomValues({
      value: old_value,
      tag: old_tag
    })
  }

  function iterateHtml (text) {
    let res = []
    let start_index = text.indexOf("<")

    // If there are no more tags
    if (start_index === -1){
    let split = text.trim().split(" ")
      tokenCounter += split.length
      return ([{
        tokens: split,
        tag: "normal",
        props: {}
      }])
    }

    let end_index = text.indexOf(">", start_index)

    // If there are no more tags
    if (end_index === -1){
      let split = text.trim().split(" ")
      tokenCounter += split.length
      return ([{
        tokens: split,
        tag: "normal",
        props: {}
      }])
    }

    // If there are tags
    let temp_tag = text.substring(start_index + 1,end_index)
    let temp_split = temp_tag.split(" ")
    let tag = "<" + temp_split[0] + ">"
    let closing_tag = tag.replace("<", "</")
    let closing_tag_index = text.indexOf(closing_tag, end_index)
    tag = "<" + temp_tag + ">"

    // If there is text before the tag
    if (start_index !== 0) {
      let initial_text = text.substring(0, start_index)
      let split = initial_text.trim().split(" ")
      if (split[0] !== "") {
        tokenCounter += split.length
        res.push({
          tokens: split,
          tag: "normal",
          props: {}
        })
      }
    }

    // If there is no closing tag (ex: single tag <hr>)
    if (closing_tag_index === -1) {
      tokenCounter += 1
      res = res.concat({
        tokens: [tag],
        tag: "normal",
        props: {}
      })
    }
    // If it is a mark tag
    else if (temp_split[0] === "mark") {
      let new_text = text.substring(end_index+1, closing_tag_index)
      let split = new_text.trim().split(" ")
      let role = temp_split[1].substring(6,9)
      value.push({
        start: tokenCounter,
        end: tokenCounter + split.length,
        tag: role,
        text: new_text
      })
      addToSidebar(new_text, role, [tokenCounter])
      let tmp_res = iterateHtml(new_text)
      res = res.concat(tmp_res)
    }
    else {
      // Iterate over main tags
      let new_text = text.substring(end_index+1, closing_tag_index)
      let tmp_res = iterateHtml(new_text)
      let props = {}
      for (let i = 1; i < temp_split.length; i++) {
        let another_split = temp_split[i].split("=")
        props[another_split[0]] = another_split[1]
      }
      res.push({
        tokens: tmp_res,
        tag: temp_split[0],
        props: props
      })
    }

    // If there is text after the tag
    if (closing_tag_index !== text.length - closing_tag.length) {
      let final_text = text.substring(closing_tag_index + closing_tag.length, text.length)
      let tmp_res = iterateHtml(final_text)
      res = res.concat(tmp_res)
    }

    return res
  }

  function readHtml () {
    let raw_text = ""
    value = []
    value_sidebar.current = []
    
    // Join main relevant html into a single string
    let split = new_example_html.split("\n")
    for (let line of split) {
      // Ignore first line
      if (line.includes("<div")){
        continue;
      }
      // Ignore table
      else if (line.includes("</div>")) {
        break
      }
      
      // Normal iteration
      raw_text += " " + line.trim()
    }

    let final_tokens = iterateHtml(raw_text)

    setAllEntites(value_sidebar.current)
    setAnomTokens(final_tokens)
    setAnomValues({
      value: value,
      //value: [],
      //value: [{start: 0, end:6, tag: "PER"}],
      tag: "PER"
    })
  }

  function box() {
    if (anomValues === null || anomTokens === null) {
      return <></>
    }
    return (
      <div className='Text'>
        <TokenAnnotator
          tokens={anomTokens}
          value={anomValues.value}
          onNewEntitie={handleNewEntitie}
          onEntitieChange={handleEntitieChange}
          getSpan={span => ({
            ...span,
            tag: anomValues.tag,
          })}
          mode={mode}
        />
      </div>
    )

  }
  

  return (
    <div className="App">
      {Header()}

      <div className='FlexContainer'>
        {box()}
        {Side()}
      </div>

      <OutsideClickHandler onOutsideClick={() => {setMenuStyle({left:0,top: 0, showMenu: false})}}>
        {ActionMenu(menuStyle.left, menuStyle.top, menuStyle.showMenu, handleTagChange)}
      </OutsideClickHandler>

      <div className='PopUp'>
        <OutsideClickHandler onOutsideClick={() => {setPopUpMenu({showMenu: false, entities: {"PER":0, "DAT":0, "ORG":0, "LOC":0, "PRO":0, "MAT":0}})}}>
          {PopUpMenu(popUpMenu.showMenu, handleMultipleTagChange, popUpMenu.entities)}
        </OutsideClickHandler>
      </div>

    </div>
  );
}

export default App;
