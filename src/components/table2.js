import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { Box, Button, ListItemIcon, MenuItem, Typography, InputLabel, FormControl, NativeSelect } from '@mui/material';
import TAG_COLORS from '../utils/tag_colors';
import React, { useRef, useState, useEffect } from 'react';

import { useAppContext } from '../context/context'
import parse from 'html-react-parser';

const TableComponent2 = (addToSidebar, removeFromSidebar, handleMultipleTagChange) => {

  const {
    value_sidebar,
    allEntities,
    anomValues,
    last_index,
    tag,
    rows,
    setRows,
    renderValue,
    setRenderValue,
    anomTokens,
  } = useAppContext()

  let anomRules = {
    "PES": "PES",
    "DAT": "DAT",
    "ORG": "ORG",
    "LOC": "LOC",
    "PRO": "PRO",
    "MAT": "MAT",
    "CEP": "CEP",
    "TEL": "TEL",
    "E-MAIL": "MAIL"
  }
  
  let entitieCounter = {
    "PES":0,
    "DAT":0,
    "ORG":0,
    "LOC":0,
    "PRO":0,
    "MAT":0,
    "CEP":0,
    "TEL":0,
    "E-MAIL":0,
  }

  useEffect(() => {
    if (renderValue.allEntities !== null) {
      createRows()
    }
    if (renderValue.anomTokens) {

    }
    if (renderValue.anomValues) {

    }
    
    // Store auto-saves in cache
    if (anomValues.current !== null) {

      let res = ""
      for (let v of anomValues.current.value) {
        res += JSON.stringify(v) + "---"
      }
      let final_res = res.slice(0 , -3)

      localStorage.setItem("ANOM_VALUES", final_res)
    }

    let token_res = ""
    if (anomTokens.current !== null) {
      for (let t of anomTokens.current) {
        token_res += JSON.stringify(t) + "---"
      }
      let final_token_res = token_res.slice(0 , -3)

      localStorage.setItem("ANOM_TOKENS", final_token_res)
    }

    let entities_res = ""
    if (allEntities.current !== null) {
      for (let e of allEntities.current) {
        entities_res += JSON.stringify(e) + "---"
      }
      let final_entities_res = entities_res.slice(0 , -3)

      localStorage.setItem("ANOM_ALL_ENTITIES", final_entities_res)
    }

  }, [renderValue])

  function handleMergeTable(selected_list) {
    let first = null
    let number_deleted = 0

    for (let id of selected_list) {
      if (first === null) {
        first = id
      }
      else {
        let tokens = value_sidebar.current[id - number_deleted].tokens
        for (let token of tokens) {
          number_deleted += 1
          removeFromSidebar(token.ids[0], true)
        }

        value_sidebar.current[first].tokens = value_sidebar.current[first].tokens.concat(tokens)
      }
    }
    
    allEntities.current = value_sidebar.current
    setRenderValue({
      anomTokens: false,
      anomValues: false,
      allEntities: true
    })
  }

  function handleSplitTable(selected_list) {
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
          addToSidebar(token.text, value_sidebar.current[id].tag, token.ids, null)
        }
      }
    }

    allEntities.current = value_sidebar.current
    setRenderValue({
      anomTokens: false,
      anomValues: false,
      allEntities: true
    })
  }

  function handleRemoveTable(selected_list) {
    let old_value = anomValues.current.value
    let old_tag = anomValues.current.tag
    let new_value = []
    let to_remove = []
    let previous_r = 0
    let number_deleted = 0

    // Id of table
    for (let id of selected_list) {
      new_value = []

      // Each token associated with the sidebar
      for (let token of value_sidebar.current[id - number_deleted].tokens) {

        // Remove from text
        for (let value_id in old_value) {
          if (token.ids.includes(old_value[value_id].id)) {
            to_remove.push(value_id)
          }
        }

        removeFromSidebar(token.ids[0], true)
        number_deleted += 1
      }

      for (let r_id of to_remove) {
        let parsed_r_id = parseInt(r_id)
        let slice = old_value.slice(previous_r, parsed_r_id)
        new_value = new_value.concat(slice)
        previous_r = parsed_r_id + 1
      }

      let slice = old_value.slice(previous_r, old_value.length)
      new_value = new_value.concat(slice)

      old_value = new_value
      to_remove = []
      previous_r = 0
    }

    allEntities.current = value_sidebar.current
    anomValues.current = {
      value: old_value,
      tag: old_tag
    }
    setRenderValue({
      anomTokens: false,
      anomValues: true,
      allEntities: true
    })
  }

  function createRows() {
    let res = []

    let old_value = anomValues.current.value

    for (let entitie of allEntities.current) {
      let entities = entitie.tokens
      let type = entitie.tag
      let name = ""
      let counter = 0
      let count = ""

      entitieCounter[type] ++

      var str = entitieCounter[type].toString()
      var pad = "000"
      var ans = pad.substring(0, pad.length - str.length) + str
      
      let anom = anomRules[type] + ans
      
      for (let e of entities) {
        name += e.text
        // If not last
        if (counter != entities.length-1) {
          //name += "<br></br>"
          name += "\n\n"
        }
        counter++

        // Add anom value to anomValues
        for (let value of old_value) {
          if (e.ids.includes(value.id)) {
            value.anom = anom
          }
        }
      }
      
      name = parse(name)
      let t_counter = 0

      for (let t of entitie.tokens) {
        count += t.ids.length.toString()
        // If not last
        if (t_counter != entitie.tokens.length-1) {
          count += "\n\n"
        }
        t_counter++
      }

      count = parse(count)
      
      res.push({ count, name, type, anom })
      entitie.anom = anom
    }

    setRows(res)
  }

  const handleTableChangeEntitie = async (row, e) => {
    tag.current = e.target.value

    let allEnt = allEntities.current

    // Get index of row in anomValues
    for (let token of allEnt[row.id].tokens) {
      let id = token.ids[0]

      // Search for id in anomValues
      for (let value_id in anomValues.current.value) {
        let value = anomValues.current.value[value_id]
        if (value.id === id) {
          tag.current = e.target.value
          last_index.current = value_id
          handleMultipleTagChange("All-Equal")
        }
      }
    }
  }

  const columns = [
    {header: "#", accessorKey: "count", maxSize:20,
    //custom conditional format and styling
    Cell: ({ cell }) => (
      <Box
        sx={() => ({
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
        })}
        >
          <span style={{fontSize:"large"}}>{cell.getValue()}</span>
      </Box>
      )},
    {header: "Entitidade", accessorKey: "name", minSize: 200, maxSize: 250,
    //custom conditional format and styling
    Cell: ({ cell }) => (
      <Box
        sx={() => ({
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
        })}
        >
          <span style={{fontSize:"large"}}>{cell.getValue()}</span>
      </Box>
      )},
    {header: "Tipo", accessorKey: "type", maxSize:40,
      //custom conditional format and styling
      Cell: ({ cell, row }) => (
        <Box
          sx={() => ({
            backgroundColor: TAG_COLORS[cell.getValue()],
            borderRadius: '0.25rem',
            color: 'black',
            maxWidth: '9ch',
            p: '0.25rem',
          })}
          >
          <FormControl fullWidth>
            <NativeSelect
              value={cell.getValue()}
              inputProps={{
                name: 'type',
                id: 'uncontrolled-native',
              }}
              onChange={async (e) => handleTableChangeEntitie(row, e)}
            >
              <option value={"PES"}>PES</option>
              <option value={"ORG"}>ORG</option>
              <option value={"DAT"}>DAT</option>
              <option value={"LOC"}>LOC</option>
              <option value={"PRO"}>PRO</option>
              <option value={"MAT"}>MAT</option>
              <option value={"CEP"}>CEP</option>
              <option value={"TEL"}>TEL</option>
              <option value={"E-MAIL"}>E-MAIL</option>
            </NativeSelect>
          </FormControl>
        </Box>
      )},
    {header: "Anom", accessorKey: "anom", maxSize:40,
      //custom conditional format and styling
      Cell: ({ cell, row }) => (
        allEntities.current[row.id] === undefined ?
          <span style={{fontSize:"large", fontStyle:"italic"}}>{cell.getValue()}</span>
          :
          <Box
            sx={() => ({
              backgroundColor: TAG_COLORS[allEntities.current[row.id].tag],
              borderRadius: '0.25rem',
              color: 'black',
              maxWidth: '9ch',
              p: '0.25rem',
            })}
          >
            <span style={{fontSize:"large", fontStyle:"italic"}}>{cell.getValue()}</span>
          </Box>
      )},
  ]

  return(
    <div className='Table'>
      <MaterialReactTable
        columns={columns}
        data={rows}
        enableRowSelection
        enableColumnOrdering
        enablePagination={false}
        enableStickyHeader
        //enableColumnResizing
        initialState={{
          density: 'compact',
        }}
        renderTopToolbarCustomActions={({ table }) => {
          const handleMerge = () => {
            let selected =[]
            table.getSelectedRowModel().flatRows.map((row) => {
              selected.push(row.id)
            });
            handleMergeTable(selected)

            table.resetRowSelection()
          };

          const handleSplit = () => {
            let selected =[]
            table.getSelectedRowModel().flatRows.map((row) => {
              selected.push(row.id)
            });
            handleSplitTable(selected)

            table.resetRowSelection()

          };

          const handleRemove = () => {
            let selected =[]
            table.getSelectedRowModel().flatRows.map((row) => {
              selected.push(row.id)
            });
            handleRemoveTable(selected)

            table.resetRowSelection()

          };

          let joinDisable = true
          let kwon_type = null
          let knon_flag = false
          for (let row of table.getSelectedRowModel().flatRows) {
          //table.getSelectedRowModel().flatRows.map((row) => {
            // If it is the first type
            if (kwon_type == null) {
              kwon_type = row.getValue('type')
            }
            // If we have more than one type selected
            if (kwon_type != row.getValue('type')) {
              knon_flag = true
              break
            }
          };

          if (knon_flag == false && table.getSelectedRowModel().flatRows.length > 1) {
            joinDisable = false
          }

          return (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                color="success"
                disabled={joinDisable}
                onClick={handleMerge}
                variant="contained"
              >
                Juntar
              </Button>
              <Button
                color="info"
                disabled={table.getSelectedRowModel().flatRows.length < 1}
                onClick={handleSplit}
                variant="contained"
              >
                Separar
              </Button>
              <Button
                color="error"
                disabled={table.getSelectedRowModel().flatRows.length < 1}
                onClick={handleRemove}
                variant="contained"
              >
                Remover
              </Button>
            </div>
          );
        }}
      />
    </div>
  )
}

export default TableComponent2