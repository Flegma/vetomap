import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Lobby, Map, Format, Mode, MapAction, Message, Action, Response, TeamSide } from '../types/types';

@Injectable()
export class ApiService {

  defaultFormat: number = 3;

  mapList: Map[] = [
    new Map('cache', true),
    new Map('cobblestone', true),
    new Map('dust2', false),
    new Map('inferno', true),
    new Map('mirage', true),
    new Map('nuke', true),
    new Map('overpass', true),
    new Map('train', true)
  ];

  formats: Format[] = [
    new Format('Best of 1', 1, [
      new Mode('Ban ... Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Random
      ]),
      new Mode('Ban x2, Ban x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Random
      ]),
      new Mode('Ban x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Random
      ]),
      new Mode('Random', [
        MapAction.Random
      ])
    ]),
    new Format('Best of 2', 2, [
      new Mode('Ban x2, Ban x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Random, MapAction.Random
      ]),
      new Mode('Ban x2, Ban x2 then Pick x2', [
        MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Pick, MapAction.Pick
      ]),
      new Mode('Ban x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Random, MapAction.Random
      ]),
      new Mode('Pick x2', [
        MapAction.Pick, MapAction.Pick
      ]),
      new Mode('Random', [
        MapAction.Random, MapAction.Random
      ]),
    ]),
    new Format('Best of 3', 3, [
      new Mode('Ban x2, Pick x2, Ban x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Pick, MapAction.Pick, MapAction.Ban, MapAction.Ban, MapAction.Random
      ]),
      new Mode('Ban x2, Ban x2, Pick x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Pick, MapAction.Pick, MapAction.Random
      ]),
      new Mode('Ban x2, Pick x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Pick, MapAction.Pick, MapAction.Random
      ]),
      new Mode('Ban x2, Ban x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Ban, MapAction.Random, MapAction.Random, MapAction.Random
      ]),
      new Mode('Pick x2 then Random', [
        MapAction.Pick, MapAction.Pick, MapAction.Random
      ]),
      new Mode('Random', [
        MapAction.Random, MapAction.Random, MapAction.Random
      ]),
    ]),
    new Format('Best of 5', 5, [
      new Mode('Ban x2, Pick x2, Pick x2 then Random', [
        MapAction.Ban, MapAction.Ban, MapAction.Pick, MapAction.Pick, MapAction.Pick, MapAction.Pick, MapAction.Random
      ]),
      new Mode('Pick x2, Ban x2, Pick x2 then Random', [
        MapAction.Pick, MapAction.Pick, MapAction.Ban, MapAction.Ban, MapAction.Pick, MapAction.Pick, MapAction.Random
      ]),
      new Mode('Pick x2, Pick x2, Ban x2 then Random', [
        MapAction.Pick, MapAction.Pick, MapAction.Pick, MapAction.Pick, MapAction.Ban, MapAction.Ban, MapAction.Random
      ]),
      new Mode('Pick x2, Pick x2 then Random', [
        MapAction.Pick, MapAction.Pick, MapAction.Pick, MapAction.Pick, MapAction.Random
      ]),
      new Mode('Pick, Ban, Pick, Ban, Pick, Pick then Random', [
        MapAction.Pick, MapAction.Ban, MapAction.Pick, MapAction.Ban, MapAction.Pick, MapAction.Pick, MapAction.Random
      ]),
      new Mode('Random', [
        MapAction.Random, MapAction.Random, MapAction.Random, MapAction.Random, MapAction.Random
      ]),
    ])
  ];

  api_url: string = 'ws://localhost:8999';
  current_lobby: Lobby = null;
  client_token: string = '';
  ws: WebSocket;

  constructor() { }

  createLobby(lobby: Lobby): Promise<Lobby> {
    return new Promise( (resolve, reject) => {
      this.ws = new WebSocket(this.api_url);
      this.ws.onerror = (error) => {
        reject("Unable to reach the server. Service unavailable. You can't create new lobby for map veto right now. I'm sorry :'(");
        this.ws.onerror = this.onError;
      };
      this.ws.onopen = () => {
        let message = new Message(Action.Create, lobby);
        this.ws.send(JSON.stringify(message));
      }
      this.ws.onmessage = (message: MessageEvent) => {
        const res: Response = JSON.parse(message.data);
        resolve(res.data.lobby);
        this.ws.onmessage = this.onMessage;
      };
    });
  }

  joinLobby(tokens: any): Promise<boolean> {
    return new Promise( (resolve, reject) => {
      const message = new Message(Action.Join, tokens);
      if (!this.ws) {
        this.ws = new WebSocket(this.api_url);
        this.ws.onopen = () => {
          this.ws.send(JSON.stringify(message));
        }
      } else {
        this.ws.send(JSON.stringify(message));
      }
      
      this.ws.onerror = (error) => {
        reject(error);
        this.ws.onerror = this.onError;
      };
      this.ws.onmessage = (message: MessageEvent) => {
        const res: Response = JSON.parse(message.data);
        if (res.error) {
          reject(res.error);
        } else {
          this.current_lobby = res.data.lobby;
          this.client_token = res.data.client_id;
          localStorage.setItem(this.current_lobby.token, this.client_token);
          resolve(true);
        }
        this.ws.onmessage = this.onMessage;
      };
    });
  }

  joinAsCaptain(side: TeamSide): Promise<boolean> {
    return new Promise( (resolve, reject) => {
      const message = new Message(Action.Captain, side);
      if (!this.ws) {
        reject('You are not connected to a lobby.')
      } else {
        this.ws.send(JSON.stringify(message));
      }

      this.ws.onerror = (error) => {
        reject(error);
        this.ws.onerror = this.onError;
      };
      this.ws.onmessage = (message: MessageEvent) => {
        const res: Response = JSON.parse(message.data);
        if (res.error) {
          reject(res.error);
        } else {
          this.current_lobby = res.data.lobby;
          resolve(true);
        }
        this.ws.onmessage = this.onMessage;
      };
    });
  }

  onError(error) {
    // console.log(error);
  }

  onMessage(message) {
    // console.log(message);
  }

}
