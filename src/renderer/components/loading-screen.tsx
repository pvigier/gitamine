import * as React from 'react';

export enum LoadingState {
  NotLoading,
  Loaded
}

export interface LoadingScreenProps { 
  state: LoadingState
}

export class LoadingScreen extends React.PureComponent<LoadingScreenProps, {}> {
  render() {
    return (
      <div className='patch-viewer'>
        Loading...
      </div>
    );
  }
}