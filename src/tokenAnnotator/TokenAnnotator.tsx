import React, {useState} from 'react'
import ReactDOMServer from 'react-dom/server'

import Mark, {MarkProps} from './Mark.tsx'
import MarkNoTag, {MarkNoTagProps} from './Mark_no_tag.tsx'
import {selectionIsEmpty, selectionIsBackwards, splitTokensWithOffsets} from './utils.ts'
import {Span} from './span.ts'
import parse from 'html-react-parser';
import { useAppContext } from '../context/context';

interface TokenProps {
  i: number
  content: string
}

interface TokenSpan {
  start: number
  end: number
  tokens: any[]
}

function tokenFunction(i, content){
  return <span id={i} data-i={i}>{parse(content)} </span>
}

export interface TokenAnnotatorProps<T>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tokens: any[]
  value: T[]
  mode: string
  anom_style : string
  onNewEntitie: (value: T, left, top, text) => any
  onEntitieChange: (index, left, top) => any
  onTagChange: (value) => any
  getSpan?: (span: TokenSpan) => T
  renderMark?: (props: MarkProps) => JSX.Element
  last_index: any
  tag: any
  // TODO: determine whether to overwrite or leave intersecting ranges.
}

const TokenAnnotator = <T extends Span>(props: TokenAnnotatorProps<T>) => {
  const renderMark = props.renderMark || (props => <Mark {...props} />)
  const renderMarkNoTag = props.renderMark || (props => <MarkNoTag {...props} />)

  let res : any[] = []
  let split_i : any = 0
  let data_i : any = 0

  const getSpan = (span: TokenSpan): T => {
    if (props.getSpan) return props.getSpan(span)
    return {start: span.start, end: span.end} as T
  }

  const handleMouseUp = () => {

    if (!props.onNewEntitie) return

    props.last_index.current = null

    const selection = window.getSelection()
    const r = selection.getRangeAt(0);
    const p = r.getBoundingClientRect();

    if (selectionIsEmpty(selection)) return
    
    let found = false
    // Anchor is first word
    let anchor = selection.anchorNode
    // Focus is last word
    let focus = selection.focusNode

    let start = 0
    let end = 0
    let max_iter = 5
    let current_iter = 0

    let text = ""

    while (!found) {
      // Avoid infinite loops
      if (current_iter === max_iter){
        break
      }
      if (
        anchor.parentElement.hasAttribute('data-i') ||
        focus.parentElement.hasAttribute('data-i')
      ) {
        start = parseInt(anchor.parentElement.getAttribute('data-i'), 10)
        end = parseInt(focus.parentElement.getAttribute('data-i'), 10)
        found = true
        break
      }
      else {
        anchor = anchor.parentElement
        focus = focus.parentElement
        current_iter += 1
      }
    }

    if (selectionIsBackwards(selection)) {
      ;[start, end] = [end, start]
    }

    end += 1

    // If we only selected 1 word
    if (start === end - 1) {
      text = anchor.textContent
    }
    // If we selected more words
    else {
      let split =  selection?.toString().split(" ")
      text = anchor.textContent + " "
      for (let i = 1; i < split?.length-1; i++) {
        text += split[i] + " "
      }
      text += focus.textContent
    }

    let temp_index = []

    for (let i = start; i < end; i++) {
      let el = document.getElementById(i.toString())
      if (el?.attributes["data-start"] != undefined) {
        let st = parseInt(el?.attributes["data-start"].value, 10)
        let en = parseInt(el?.attributes["data-end"].value, 10)
        const splitIndex = props.value.findIndex(s => s.start === st && s.end === en)
        temp_index.push(splitIndex)
        // props.tag.current = "Remove"
        // props.onTagChange("Single")
      }
    }

    props.last_index.current = temp_index

    props.tag.current = "PER"
    
    props.onNewEntitie(getSpan({start, end, tokens: props.tokens.slice(start, end)}), p.left, p.top + window.scrollY, text)
    //window.getSelection().empty()
  }

  const handleSplitClick = ({start, end}) => {
    props.last_index.current = null

    const selection = window.getSelection()
    const r = selection.getRangeAt(0);
    const p = r.getBoundingClientRect();
    // Find and remove the matching split.
    const splitIndex = props.value.findIndex(s => s.start === start && s.end === end)
    if (splitIndex >= 0) {
      onEntitieChange(splitIndex, p.left, p.top + window.scrollY)
    }
  }

  const calculateSplits = (tokens, value, onNewEntitie, onEntitieChange, handleSplitClick) => {
    let tmp_res : any[] = []
    const splits = splitTokensWithOffsets(tokens, value, split_i)
    splits.forEach(split => {
      if (split.mark) {
        if (split.true_end){
          let mark = renderMark({
            key: `${split.start}-${split.end}`,
            ...split,
            onClick: handleSplitClick,
            mode: props.mode,
            anom_style : props.anom_style,
            data_i: data_i
          })
          tmp_res.push(mark)
          let split_length = split.content.split(" ")
          data_i += split_length.length
        }
        else {
          let mark = renderMarkNoTag({
            key: `${split.start}-${split.end}`,
            ...split,
            onClick: handleSplitClick,
            mode: props.mode,
            anom_style : props.anom_style,
            data_i: data_i
          })
          tmp_res.push(mark)
          let split_length = split.content.split(" ")
          data_i += split_length.length
        }
      }
      else {
        if (split.content) {
          tmp_res.push(tokenFunction(data_i, split.content))
        }
        data_i++
      }
    });
    split_i += tokens.length
    return tmp_res
  }

  const iterateSplits = (token_list, value, onNewEntitie, onEntitieChange, handleSplitClick) => {
    if (token_list.tag === "normal") {
      let tmp = calculateSplits(token_list.tokens, value, onNewEntitie, onEntitieChange, handleSplitClick)
      return tmp
    }
    else {
      let final_tmp: any[] = []
      token_list.tokens.forEach(element => {
        let tmp :any = iterateSplits(element, value, onNewEntitie, onEntitieChange, handleSplitClick)
        final_tmp.push(tmp)
      });

      //let string = token_list.open_tag + ReactDOMServer.renderToString(final_tmp) + token_list.close_tag
      let element = React.createElement(token_list.tag , token_list.props, final_tmp)
      
      return(
        element
      )
    }
  }

  const nothing = () => {}

  const {tokens, value, onNewEntitie, onEntitieChange, getSpan: _, ...divProps} = props
  tokens.forEach(element => {
    let tmp: any = iterateSplits(element, value, onNewEntitie, onEntitieChange, handleSplitClick)
    res.push(tmp)
  });

  return (
    <div {...divProps} onMouseUp={() => props.mode === "Preview" ? nothing() : handleMouseUp()}>
      {res}
    </div>
  )
}

export default TokenAnnotator