import React from 'react'
import {SafeAreaView, View, Text, FlatList} from 'react-native'

const getLineStatusFromApi = async () => {
  try {
    const response = await fetch(
      'https://api.tfl.gov.uk/line/mode/tube,dlr,overground/status',
    )
    const data = await response.json()
    return data
  } catch (e) {
    console.log('err occurred :', e)
  }
}

const extractDisruptions = lineStatuses => {
  const hasDisruption = lineStatuses.some(ls => ls.statusSeverity !== 10)
  if (hasDisruption) {
    return lineStatuses
      .map(ls => (ls.statusSeverity !== 10 ? ls : null))
      .filter(Boolean)
      .map(ls => {
        return {
          description: ls.statusSeverityDescription,
          status: ls.statusSeverity,
        }
      })
  } else return null
}

let _cacheResult = ''
let updateState = true
let _oldResult = []
const buildProjectViewModel = result => {
  if (JSON.stringify(result) === _cacheResult) {
    updateState = false
    console.log('same result so returning')
    return _oldResult
  }
  _oldResult = result.reduce((prev, curr) => {
    const disruptions = extractDisruptions(curr.lineStatuses)
    if (disruptions) {
      prev.push({
        id: curr.id,
        name: curr.name,
        mode: curr.modeName,
        disruptions,
      })
    }
    return prev
  }, [])
  updateState = true
  _cacheResult = JSON.stringify(result)
  console.log('change in status')
  return _oldResult
}

const bootstrapProjectData = setLines => {
  console.log('getting line status!!')
  getLineStatusFromApi()
    .then(buildProjectViewModel)
    .then(vm => {
      if (!updateState) return []
      vm.push({name: 'good-service'})
      setLines(vm)
    })

  setInterval(() => bootstrapProjectData(), 10000)
}

const getLineColors = () => {
  const lines = []
  lines['circle'] = 'red'
  lines['london-overground'] = '#e86a10'
  lines['bakerloo'] = '#b26300'
  lines['waterloo'] = '#76d0bd'
  lines['victoria'] = '#039ae5'
  lines['circle'] = '#ffca0a'
  lines['metropolitan'] = '#9b0058'
  lines['waterloo-city'] = '#76d0bd'
  lines['district'] = '#007d32'
  lines['northern'] = 'black'

  return lines
}

const debug = false

const App: () => React$Node = () => {
  const [lines, setLines] = React.useState([])
  bootstrapProjectData(setLines)
  const linesColors = getLineColors()
  const allLinesMessage = lines.some(
    l => l.disruptions && l.disruptions.length > 0,
  )
    ? 'Good service on all other lines'
    : 'Good service on all lines'

  return (
    <>
      {debug && (
        <Text>
          {JSON.stringify(lines, null, 2)} - {JSON.stringify(linesColors)}
        </Text>
      )}
      <SafeAreaView style={{flex: 1, backgroundColor: '#0019a8'}}>
        <FlatList
          data={lines}
          renderItem={({item}) => {
            if (item.name === 'good-service') {
              return (
                <View>
                  <Text
                    style={{
                      flex: 3,
                      color: 'white',
                      fontSize: 100,
                      padding: 20,
                    }}>
                    {allLinesMessage}
                  </Text>
                </View>
              )
            }
            return (
              <View
                style={{
                  flex: 1,
                  borderColor: 'grey',
                  borderWidth: 1,
                  height: 50,
                  flexDirection: 'row',
                  backgroundColor: 'white',
                  alignContent: 'space-around',
                }}>
                <View
                  style={{
                    flex: 2,
                    flexDirection: 'column',
                    borderLeftColor: linesColors[item.id],
                    borderLeftWidth: 10,
                  }}>
                  <Text style={{}}>{item.name}</Text>
                </View>
                {item.disruptions && item.disruptions.length > 0 && (
                  <View style={{flex: 1, flexDirection: 'column'}}>
                    <Text>{item.disruptions[0].description}</Text>
                  </View>
                )}
              </View>
            )
          }}
          keyExtractor={item => item.name}
        />
      </SafeAreaView>
    </>
  )
}
export default App
