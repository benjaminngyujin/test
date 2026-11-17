import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'InnovationPulseWebPartStrings';
import InnovationPulse from './components/InnovationPulse';
import { SharePointListsService, IListSettings } from './services/SharePointListsService';

export interface IInnovationPulseWebPartProps extends IListSettings {}
export default class InnovationPulseWebPart extends BaseClientSideWebPart<IInnovationPulseWebPartProps> {
  private service: SharePointListsService | undefined;
  private serviceKey = '';
  public render(): void {
    const settings: IListSettings = {
      newsList: (this.properties.newsList || '').trim(),
      viewsList: (this.properties.viewsList || '').trim(),
      enableTracking: this.properties.enableTracking === true
    };
    const key = JSON.stringify(settings);
    if (!this.service || key !== this.serviceKey) {
      this.serviceKey = key;
      this.service = new SharePointListsService(this.context.spHttpClient, this.context.pageContext.web.absoluteUrl, settings, {
        name: this.context.pageContext.user.displayName, account: this.context.pageContext.user.loginName
      });
    }
    // Changing list settings remounts the UI, discarding responses from the old service.
    ReactDom.render(React.createElement(InnovationPulse, { service: this.service, key }), this.domElement);
  }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
  protected get dataVersion(): Version { return Version.parse('1.0'); }
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [{ header: { description: strings.PropertyPaneDescription }, groups: [{ groupName: 'SharePoint lists (current site)', groupFields: [
      PropertyPaneTextField('newsList', { label: 'News list name or GUID', description: 'Required. Configure this after porting to your SharePoint site.' }),
      PropertyPaneTextField('viewsList', { label: 'Interactions list name or GUID', description: 'Optional. Leave blank to hide readership insights and disable tracking.' }),
      PropertyPaneToggle('enableTracking', { label: 'Record readership interactions', onText: 'Enabled', offText: 'Disabled' })
    ] }] }] };
  }
}
